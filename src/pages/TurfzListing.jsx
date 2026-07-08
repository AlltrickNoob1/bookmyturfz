import React, { useState } from "react";
import "../style/turf.css";
import { TurfNav } from "../components/TurfNav";
import { Turfdata } from "../components/Turfdata";
import { Footer } from "../components/Footer";

export const TurfzListing = () => {
  const [turf, setTurf] = useState("All");
  const [search, setSearch] = useState("");

  return (
    <div id="mainContainer">
      <TurfNav setTurf={setTurf} onSearchChange={setSearch} search={search} />
      {/* <MapContainer/> */}
      <Turfdata turf={turf} search={search} />
      <Footer />
    </div>
  );
};
