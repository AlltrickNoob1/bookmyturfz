import React from 'react'
import {Navigate} from "react-router-dom"
import { useUserAuth } from '../context/Authcontext';

export const ProtectedRoute = ({children}) => {
    let {user, authLoading} = useUserAuth();

    if (authLoading) {
       // while auth state is initializing, don't redirect
       return <div style={{color: 'white', textAlign: 'center', marginTop: '100px'}}>Loading...</div>;
    }

    if (!user) {
       return <Navigate to="/" />;
    }

    return children;
}
