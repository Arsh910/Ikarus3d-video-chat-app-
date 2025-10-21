import re
import time
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.core.cache import cache

def sanitize_room_id(raw_id: str, max_len: int = 80) -> str:
    if not raw_id:
        return "default"
    safe = re.sub(r"[^0-9A-Za-z\-\._]", "_", str(raw_id))
    return safe[:max_len]

def room_cache_key(safe_id: str) -> str:
    return f"video_room_participants_{safe_id}"

def room_owner_key(safe_id: str) -> str:
    return f"video_room_owner_{safe_id}"

def room_pending_key(safe_id: str) -> str:
    return f"video_room_pending_{safe_id}"

def room_permissions_key(safe_id: str) -> str:
    return f"video_room_permissions_{safe_id}"

def room_group_name(safe_id: str) -> str:
    return f"video_room.{safe_id}"

def default_permissions():
    return {"allowed": True, "unmute": True, "video": True}

def owner_permissions():
    return {"allowed": True, "unmute": True, "video": True, "is_owner": True}

class VideoRoomConsumer(AsyncJsonWebsocketConsumer):
    """
    AsyncJsonWebsocketConsumer for room signaling + admin controls.
    """

    async def connect(self):
        await self.accept()
        self.safe_room_id = None
        self.group_name = None
        self.display_name = None

    async def disconnect(self, close_code):
        if self.safe_room_id:
            await self._remove_participant(self.safe_room_id, self.channel_name)

            perms_map = cache.get(room_permissions_key(self.safe_room_id)) or {}
            if self.channel_name in perms_map:
                perms_map.pop(self.channel_name, None)
                cache.set(room_permissions_key(self.safe_room_id), perms_map)

            await self.channel_layer.group_send(
                self.group_name,
                {"type": "group.message", "payload": {"typeof": "participant-left", "socketId": self.channel_name}},
            )
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def _add_participant(self, safe_id, channel_name, display_name):
        key = room_cache_key(safe_id)
        participants = cache.get(key) or {}
        participants[channel_name] = {"name": display_name}
        cache.set(key, participants)

    async def _remove_participant(self, safe_id, channel_name):
        key = room_cache_key(safe_id)
        participants = cache.get(key) or {}
        if channel_name in participants:
            participants.pop(channel_name, None)
            cache.set(key, participants)

    async def _get_participants(self, safe_id):
        key = room_cache_key(safe_id)
        participants = cache.get(key) or {}
        return [{"socketId": cid, "name": info.get("name", "")} for cid, info in participants.items()]

    async def _add_pending(self, safe_id, channel_name, display_name):
        key = room_pending_key(safe_id)
        pending = cache.get(key) or {}
        pending[channel_name] = {"name": display_name, "ts": time.time()}
        cache.set(key, pending)

    async def _remove_pending(self, safe_id, channel_name):
        key = room_pending_key(safe_id)
        pending = cache.get(key) or {}
        if channel_name in pending:
            pending.pop(channel_name, None)
            cache.set(key, pending)

    async def _get_pending(self, safe_id):
        key = room_pending_key(safe_id)
        pending = cache.get(key) or {}
        return [{"socketId": cid, "name": info.get("name", ""), "ts": info.get("ts")} for cid, info in pending.items()]

    async def _set_permissions(self, safe_id, channel_name, perms):
        key = room_permissions_key(safe_id)
        perms_map = cache.get(key) or {}
        perms_map[channel_name] = perms
        cache.set(key, perms_map)

    async def _get_permissions(self, safe_id):
        key = room_permissions_key(safe_id)
        return cache.get(key) or {}

    async def _get_owner(self, safe_id):
        key = room_owner_key(safe_id)
        return cache.get(key)

    async def _set_owner_if_missing(self, safe_id, channel_name):
        key = room_owner_key(safe_id)
        owner = cache.get(key)
        if not owner:
            cache.set(key, channel_name)
            return channel_name
        return owner

    async def receive_json(self, content, **kwargs):
        typeof = content.get("typeof") or content.get("type")

        # --- join-room ---
        if typeof == "join-room":
            meeting_id_raw = content.get("meetingId")
            display_name = content.get("name") or f"User-{self.channel_name[-6:]}"
            if not meeting_id_raw:
                await self.send_json({"typeof": "error", "message": "meetingId required"})
                return

            safe_id = sanitize_room_id(meeting_id_raw)
            self.safe_room_id = safe_id
            self.group_name = room_group_name(safe_id)
            self.display_name = display_name

            owner = await self._set_owner_if_missing(safe_id, self.channel_name)
            if owner == self.channel_name:
                await self.channel_layer.group_add(self.group_name, self.channel_name)
                await self._add_participant(safe_id, self.channel_name, self.display_name)
                await self._set_permissions(safe_id, self.channel_name, owner_permissions())

                await self.send_json({"typeof": "permission-update", "permissions": owner_permissions()})
                await self.send_json({"typeof": "owner-assigned", "socketId": self.channel_name})
                await self.send_json({"typeof": "your-id", "socketId": self.channel_name})
                
                participants = await self._get_participants(safe_id)
                existing = [p for p in participants if p["socketId"] != self.channel_name]
                await self.send_json({"typeof": "existing-participants", "participants": existing})

                pending = await self._get_pending(safe_id)
                if pending:
                    await self.send_json({"typeof": "pending-list", "pending": pending})
                return

            # Non-owner: add to pending and notify owner
            await self._add_pending(safe_id, self.channel_name, self.display_name)
            await self.send_json({"typeof": "your-id", "socketId": self.channel_name})

            participants_before = await self._get_participants(safe_id)
            for p in participants_before:
                target = p.get("socketId")
                if not target:
                    continue
                try:
                    await self.channel_layer.send(
                        target,
                        {"type": "peer.relay", "payload": {"typeof": "join-request", "socketId": self.channel_name, "name": self.display_name}},
                    )
                except Exception as e:
                    print(f"Error sending join-request: {e}")

            await self.send_json({"typeof": "join-pending", "message": "Waiting for host approval"})
            return

        # --- admit / deny (owner only) ---
        if typeof in ("admit", "deny"):
            meeting_id_raw = content.get("meetingId")
            target = content.get("socketId")
            name = content.get("name") or "Guest"
            if not meeting_id_raw or not target:
                return
            safe_id = sanitize_room_id(meeting_id_raw)
            owner_channel = await self._get_owner(safe_id)
            
            if owner_channel != self.channel_name:
                await self.send_json({"typeof": "error", "message": "not authorized"})
                return

            if typeof == "admit":
                print(f"[ADMIT] Admitting {target} to {safe_id}")
                await self._remove_pending(safe_id, target)
                await self.channel_layer.group_add(room_group_name(safe_id), target)
                
                # Add participant BEFORE getting the list
                await self._add_participant(safe_id, target, name)
                await self._set_permissions(safe_id, target, default_permissions())

                # Get all participants including the newly added one
                all_participants = await self._get_participants(safe_id)
                # Get existing participants (excluding the new one)
                existing = [p for p in all_participants if p["socketId"] != target]
                
                print(f"[ADMIT] Sending to {target}: existing={len(existing)} participants")
                
                try:
                    # Send messages to the newly admitted user
                    await self.channel_layer.send(target, {
                        "type": "peer.relay", 
                        "payload": {"typeof": "permission-update", "permissions": default_permissions()}
                    })
                    
                    await self.channel_layer.send(target, {
                        "type": "peer.relay", 
                        "payload": {"typeof": "existing-participants", "participants": existing}
                    })
                    
                    await self.channel_layer.send(target, {
                        "type": "peer.relay", 
                        "payload": {"typeof": "admitted"}
                    })
                    
                except Exception as e:
                    print(f"Error sending admit messages to {target}: {e}")

                # Notify ALL existing participants about the new participant
                for p in existing:
                    pid = p.get("socketId")
                    if not pid:
                        continue
                    print(f"[ADMIT] Notifying {pid} about new participant {target}")
                    try:
                        await self.channel_layer.send(pid, {
                            "type": "peer.relay", 
                            "payload": {"typeof": "new-participant", "socketId": target, "name": name}
                        })
                    except Exception as e:
                        print(f"Error notifying {pid}: {e}")

                return

            else:
                await self._remove_pending(safe_id, target)
                try:
                    await self.channel_layer.send(target, {
                        "type": "peer.relay", 
                        "payload": {"typeof": "join-denied", "message": "Host denied the request"}
                    })
                except Exception as e:
                    print(f"Error sending deny message: {e}")
                return

        # --- ready-for-offers ---
        if typeof == "ready-for-offers":
            meeting_id_raw = content.get("meetingId")
            if not meeting_id_raw:
                return
            safe_id = sanitize_room_id(meeting_id_raw)
            sender = self.channel_name
            participants = await self._get_participants(safe_id)
            
            print(f"[READY] {sender} ready for offers from {len(participants)} participants")
            
            # Ask all OTHER participants to create offers to this sender
            for p in participants:
                pid = p.get("socketId")
                if not pid or pid == sender:
                    continue
                print(f"[READY] Asking {pid} to create offer to {sender}")
                try:
                    await self.channel_layer.send(pid, {
                        "type": "peer.relay", 
                        "payload": {"typeof": "create-offers", "socketId": sender}
                    })
                except Exception as e:
                    print(f"Error sending create-offers to {pid}: {e}")
            return

        # --- grant-permission (owner only) ---
        if typeof == "grant-permission":
            meeting_id_raw = content.get("meetingId")
            target = content.get("socketId")
            perms = content.get("permissions") or {}
            if not meeting_id_raw or not target:
                return
            safe_id = sanitize_room_id(meeting_id_raw)
            owner_channel = await self._get_owner(safe_id)
            
            if owner_channel != self.channel_name:
                await self.send_json({"typeof": "error", "message": "not authorized"})
                return

            perms_map = await self._get_permissions(safe_id)
            target_perms = perms_map.get(target, default_permissions())
            target_perms.update(perms)
            perms_map[target] = target_perms
            cache.set(room_permissions_key(safe_id), perms_map)

            try:
                await self.channel_layer.send(target, {
                    "type": "peer.relay", 
                    "payload": {"typeof": "permission-update", "permissions": target_perms}
                })
            except Exception as e:
                print(f"Error sending permission update: {e}")

            await self.send_json({"typeof": "permission-granted", "socketId": target, "permissions": target_perms})
            return

        # --- signaling relays: offer / answer / ice ---
        if typeof in ("offer", "answer", "ice_candidate", "ice-candidate"):
            to = content.get("to")
            if not to:
                return
            
            payload = {"typeof": typeof, "from": self.channel_name}
            if typeof == "offer":
                payload["offer"] = content.get("offer")
            elif typeof == "answer":
                payload["answer"] = content.get("answer")
            else:
                payload["candidate"] = content.get("candidate") or content.get("ice")
            
            try:
                await self.channel_layer.send(to, {"type": "peer.relay", "payload": payload})
            except Exception as e:
                print(f"Error sending signaling message: {e}")
            return

        # --- chat ---
        if typeof == "chat-message":
            meeting_id_raw = content.get("meetingId")
            text = content.get("text")
            from_name = content.get("fromName") or self.display_name or self.channel_name
            if not meeting_id_raw:
                return
            
            safe_id = sanitize_room_id(meeting_id_raw)
            
            await self.channel_layer.group_send(
                room_group_name(safe_id),
                {"type": "group.message", "payload": {"typeof": "chat-message", "fromName": from_name, "text": text}}
            )
            return

        # --- endcall relay ---
        if typeof == "endcall":
            to = content.get("to")
            if to:
                try:
                    await self.channel_layer.send(to, {
                        "type": "peer.relay", 
                        "payload": {"typeof": "endcall", "from": self.channel_name}
                    })
                except Exception as e:
                    print(f"Error sending endcall: {e}")
            return
        

        if typeof == "kick-user":
            meeting_id_raw = content.get("meetingId") or getattr(self, "safe_room_id", None)
            target = content.get("socketId")
            reason = content.get("reason", None)

            safe_id = sanitize_room_id(meeting_id_raw)
            owner_channel = await self._get_owner(safe_id)

            try:
                await self.channel_layer.send(target, {
                    "type": "peer.relay",
                    "payload": {"typeof": "you-were-kicked", "message": "You have been kicked by the host.", "reason": reason}
                })
            except Exception as e:
                print(f"Error sending kick notification to {target}: {e}")

            return




    async def group_message(self, event):
        payload = event.get("payload", {})
        await self.send_json(payload)

    async def peer_relay(self, event):
        payload = event.get("payload", {})
        await self.send_json(payload)
