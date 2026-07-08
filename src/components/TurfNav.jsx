import React, { useState, useEffect } from "react";
import turfbg from "../images/turfbg.jpg";
import logo from "../images/navlogo.png";
import "../style/turf.css";
import { MdLocationOn } from "react-icons/md";
import { Select, Input } from "@chakra-ui/react";
import { db } from "../firebase-config/config";
import { collection, getDocs } from "firebase/firestore";
import { useUserAuth } from "../context/Authcontext";
import { PopoverProfile } from "./Popover";

export const TurfNav = ({ setTurf, onSearchChange, search }) => {
  const [allSports, setAllSports] = useState([
    "All",
    "cricket",
    "football",
    "basketball",
    "badminton",
  ]);

  const [selectedSport, setSelectedSport] = useState("All");

  const { user, logout } = useUserAuth();

  useEffect(() => {
    const fetchSports = async () => {
      try {
        const sports = ["cricket", "football", "basketball", "badminton"];
        const sportSet = new Set();

        for (const sport of sports) {
          const snap = await getDocs(collection(db, sport));

          if (!snap.empty) {
            sportSet.add(sport);
          }
        }

        setAllSports(["All", ...Array.from(sportSet)]);
      } catch (err) {
        console.log(err);
      }
    };

    fetchSports();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.log(err.message);
    }
  };

  return (
    <>
      <div id="turfnavbg">
        <img src={turfbg} alt="" />
      </div>

      <div id="turfNavContainer">
        <div id="topNavturf">
          <div id="turfNav">
            <img src={logo} alt="" />
          </div>

          <div id="navBtns">
            <PopoverProfile
              handleLogout={handleLogout}
              email={user ? user.email : ""}
            />
          </div>
        </div>

        <div id="midNavTurf">
          <p>IT'S ALL STARTED HERE!</p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              width: "100%",
              maxWidth: "560px",
            }}
          >
            <Input
              placeholder="Search by turf name or location"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              bg="white"
              color="black"
              size="md"
            />

            <MdLocationOn color="white" size={24} />
          </div>
        </div>

        <div id="botNavTurf">
          <Select
            value={selectedSport}
            onChange={(e) => {
              setSelectedSport(e.target.value);
              setTurf(e.target.value);
            }}
            width="280px"
            bg="white"
            color="black"
          >
            {allSports.map((sport) => (
              <option key={sport} value={sport}>
                {sport === "All"
                  ? "All Sports"
                  : sport.charAt(0).toUpperCase() + sport.slice(1)}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </>
  );
};
