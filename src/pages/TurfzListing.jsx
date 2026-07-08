import React, { useState } from "react";
import "../style/turf.css";
import { TurfNav } from "../components/TurfNav";
import { Turfdata } from "../components/Turfdata";
import { Footer } from "../components/Footer";



export const TurfzListing = () => {
  const [search, setSearch] = useState("");

<TurfNav
  setTurf={setTurf}
  onSearchChange={setSearch}
  search={search}
/>

<Turfdata
  turf={turf}
  search={search}
/>
};
