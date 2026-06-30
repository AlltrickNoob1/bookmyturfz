import React, { useState } from "react";
import "../style/turf.css";
import { TurfNav } from "../components/TurfNav";
import { Turfdata } from "../components/Turfdata";
import { Footer } from "../components/Footer";



export const TurfzListing = () => {
  const [turf, setTurf] = useState("All");
  const [city, setCity] = useState("All");

  return (
    <div id="mainContainer">
      <TurfNav setTurf={setTurf} onCityChange={setCity} city={city} />
      {/* <MapContainer/> */}
      <Turfdata turf={turf} city={city} />
      <Footer />
    </div>
  );
};
