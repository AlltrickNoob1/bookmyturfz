import { Input, Button } from '@chakra-ui/react'
import React, { useState } from 'react'
import loginBg from "../images/loginBg.png"
import googleimg from "../images/search.png"
import "../style/login.css"
import { Link ,useNavigate, useLocation } from "react-router-dom";
import { useUserAuth } from "../context/Authcontext";
import { Alert } from "@chakra-ui/react";
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase-config/config';
import * as authUtils from '../utils/authUtils.js';

export const Login = () => {
    const [email,setEmail] = useState("");
    const [pass,setPass] = useState("")
    const [error,setError] = useState("")
    const {login,googleSignin} = useUserAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const adminEmail = authUtils.getConfiguredAdminEmail();

    // handle sign in 
    const handlesignin = async() => {
      setError("")
      try{
        await login(email,pass)
        alert("Login Successfully")
        const params = new URLSearchParams(location.search);
        const next = params.get("next") || "/turf";
        navigate(next);
      } catch(err) {
        if (err.code === "auth/too-many-requests") {
          setError("Too many login attempts. Please wait a few minutes and try again. If this persists, check Firebase Console auth settings.");
          return;
        }

        if (err.code === "auth/user-not-found" && authUtils.isMatchingAdminEmail(email, adminEmail)) {
          setError("Admin account not found. Please sign up or contact support.");
          return;
        }

        if ((err.code === "auth/wrong-password" || err.code === "auth/invalid-login-credentials") && authUtils.isMatchingAdminEmail(email, adminEmail)) {
          try {
            await sendPasswordResetEmail(auth, adminEmail);
            setError(`Admin password mismatch. Reset link sent to ${adminEmail}.`);
          } catch (resetErr) {
            setError(`Admin password mismatch. Could not send reset email: ${resetErr.message}`);
          }
          return;
        }

        setError(err.message);
      }
    }
    const signinWithgoogle = async() => {
      try{
       await googleSignin()
       const params = new URLSearchParams(location.search);
        const next = params.get("next") || "/turf";
        navigate(next);
      }catch(err){
        console.log(err)
      }
    }
  return (
    <div id='loginContainer'>
        <div id='loginBg'>
            <img src={loginBg} alt="" />
        </div>
        <div id='loginform'>
            <h1 id='headingLogin'>LOGIN</h1>
            {
            error && <Alert variant={"subtle"} status='error'>{error}</Alert>
           }
            <div>
              <p id='username'>EMAIL</p>
              <Input type="text" placeholder='EMAIL' onChange={(e)=>setEmail(e.target.value)} border="2px solid black"/>
            </div>
            <div>
               <p id='password'>PASSWORD</p>
               <Input type="password" placeholder='PASSWORD' onChange={(e)=>setPass(e.target.value)} border="2px solid black"/>
            </div>
            <Button id='loginFormBtn' onClick={handlesignin}>Login</Button>
            <Button id='loginwithBtn' onClick={signinWithgoogle}>
              <div id='glogo'>
                <img src={googleimg} alt="" />
              </div>
              <p id='gtext'>Login with Google</p>
            </Button>
             <p>Don't have an account? <Link to={"/signup"}>Sign Up</Link></p>
        </div> 
    </div>
  )
}
