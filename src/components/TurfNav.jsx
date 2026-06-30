import React, { useState, useEffect } from "react";
import turfbg from "../images/turfbg.jpg";
import logo from "../images/navlogo.png";
import "../style/turf.css";
import { MdLocationOn } from "react-icons/md";
import { Select } from "@chakra-ui/react";
import { db } from "../firebase-config/config";
import { collection, getDocs } from "firebase/firestore";
import { useUserAuth } from "../context/Authcontext";
import { PopoverProfile } from "./Popover";

export const TurfNav = (prop) => {
  const { setTurf, onCityChange, city } = prop;
  const [cities, setCities] = useState(["All"]);
  const [allSports, setAllSports] = useState(["cricket", "football", "basketball", "badminton"]);
  // Removed unused docsBySport

  const [selectedSport, setSelectedSport] = useState("All");
  useEffect(() => {
    // Fetch all sports collections and gather all unique cities and sports (one-time fetch)
    const fetchDropdowns = async () => {
      const sportsList = ["cricket", "football", "basketball", "badminton"];
      const docsBySportTemp = {};
      for (const s of sportsList) {
        const snap = await getDocs(collection(db, s));
        docsBySportTemp[s] = snap.docs.map((doc) => ({ ...doc.data(), id: doc.id, sport: s }));
      }
      // recompute city set and sports set
      const citySet = new Set();
      const sportSet = new Set();
      Object.values(docsBySportTemp).forEach((arr) => {
        (arr || []).forEach((d) => {
          // City
          if (d.city) citySet.add(d.city);
          else if (d.address) {
            const parts = d.address.split(",");
            const c = parts[parts.length - 1].trim();
            if (c) citySet.add(c);
          }
          // Sport
          if (d.sport) sportSet.add(d.sport);
        });
      });
      const cityList = ["All", ...Array.from(citySet).sort()];
      setCities(cityList);
      const sportsDropdown = ["All", ...Array.from(sportSet).sort()];
      setAllSports(sportsDropdown);
      if (city && city !== "All" && !citySet.has(city)) {
        // selected city no longer exists — reset to All
        onCityChange && onCityChange("All");
      }
    };
    fetchDropdowns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
    const { user, logout } = useUserAuth();

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
            <PopoverProfile handleLogout={handleLogout} email={user ? user.email : ''} />
          </div>
        </div>
        <div id="midNavTurf">
          <p>IT'S ALL STARTED HERE!</p>
           <div  style={{display: 'flex', gap: 12, alignItems: 'center'}}>
            <Select width="180px" bg="white" color="black" aria-label="Choose location" value={city || "All"} onChange={(e)=> onCityChange ? onCityChange(e.target.value) : null}>
              {cities.map((c) => (
                <option key={c} value={c}>{c === 'All' ? 'All Locations' : c}</option>
              ))}
            </Select>
            <MdLocationOn fontWeight={"bold"} color="white" />
          </div>
        </div>
        <div id="botNavTurf">
          <p id="botNavText">
            
            <span
              style={{
                color: "red",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
             
            </span>
          </p>
          <Select
            value={selectedSport}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedSport(val);
              setTurf(val);
            }}
            width="280px"
            bg="white"
            color="black"
            aria-label="Choose sport"
          >
            {allSports.map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All Sports" : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </>
  );
};

// Reset selectedSport if allSports changes and current selectedSport is not present
// (Moved outside the component to avoid unreachable code. If needed, place inside the component above return.)
