import { useEffect, useState } from 'react'
import Router from './router'
import { Themeprovider } from './context/themeContext'

import {ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [thememode , changemode] = useState('light');

  const changeMode = ()=>{
    if(thememode == 'light'){
      changemode('dark');
    }
    else{
      changemode('light');
    }
  }

  // saved theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('ikarus-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      changemode(savedTheme);
    }
  }, []);

  // change theme
  useEffect(()=>{
    let cl = document.querySelector('html').classList;
    cl.remove('light' , 'dark');
    cl.add(thememode);

    localStorage.setItem('ikarus-theme', thememode);
  },[thememode])


  return (
    <>
    <Themeprovider value={{thememode , changeMode}}>
      <ToastContainer autoClose={2000} />  
      <Router/>
    </Themeprovider>
    </>
  )
}

export default App
