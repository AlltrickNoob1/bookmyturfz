import React from "react";
// import {BiLogoFacebookCircle,BiLogoInstagram,BiLogoLinkedinSquare} from "react-icons/bi"
import { FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useUserAuth } from "../context/Authcontext";

export const Footer = () => {
  const { user } = useUserAuth();
  const adminEmail = process.env.REACT_APP_ADMIN_EMAIL || "admin@example.com";
  return (
    <div id="footer">
      <div>
        <p id="footerText">
          FIND AND BOOK YOUR NEAREST <span style={{ color: "red" }}>TURF</span>{" "}
          JUST A CLICK AWAY!
        </p>
      </div>
      <div id="iconsContainer">
        <div id="icons">
          <FaFacebook />
          <FaInstagram />
          <FaLinkedin />
        </div>
      </div>
      {user && user.email === adminEmail && (
        <div style={{ marginTop: 8 }}>
          <Link to="/admin" style={{ color: "#6fbaed" }}>Admin Panel</Link>
        </div>
      )}
    </div>
  );
};
