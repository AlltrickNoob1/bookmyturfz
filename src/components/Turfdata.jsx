import React, { useEffect, useState } from "react";
import { db, database } from "../firebase-config/config";
import { collection, getDocs } from "firebase/firestore";
import { ref, onValue, remove } from "firebase/database";
import { Loading } from "./Loading";
import { TimeSelectModal } from "./TimeSelectModal";

export const Turfdata = (prop) => {
  const { turf, search } = prop;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [, setElement] = useState({});
  const [time,setTime] = useState("");
  const [turfName,setTurfName] = useState("");
  const [turfSlots, setTurfSlots] = useState({});
  const [selectedTurf, setSelectedTurf] = useState(null);
  const [isChartOpen, setIsChartOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // const navigate = useNavigate()


  const SLOT_TIMES = [
    "6:00 AM",
    "8:00 AM",
    "10:00 AM",
    "12:00 PM",
    "2:00 PM",
    "4:00 PM",
    "6:00 PM",
    "8:00 PM",
    "10:00 PM",
    "12:00 AM",
    "2:00 AM",
    "4:00 AM",
  ];

  const getSlotMatrix = (turfId) => {
    const turfData = turfSlots[turfId] || {};
    // slots are stored directly under turfId: turf/{turfId}/slots/{date}/{time}
    const slotsForTurf = turfData.slots || turfData || {};
    const today = new Date();

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateKey = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const slotDay = slotsForTurf[dateKey] || {};
      const bookedCount = SLOT_TIMES.filter((time) => slotDay[time] === 'booked').length;
      const availableCount = SLOT_TIMES.length - bookedCount;
      dates.push({ dateKey, dayName, bookedCount, availableCount });
    }

    const matrix = SLOT_TIMES.map((slot) => ({
      slot,
      cells: dates.map((d) => {
        const slotDay = slotsForTurf[d.dateKey] || {};
        return {
          date: d.dateKey,
          booked: slotDay[slot] === 'booked',
        };
      }),
    }));

    return { dates, matrix };
  };

  // NOTE: using getSlotMatrix already calculates all needed availability, so helper functions removed to avoid no-unused-vars.

  const cleanupOldSlots = (slotsData) => {
    const today = new Date();
    const cutoff = new Date(today);
    cutoff.setDate(today.getDate() - 8);

    for (const turfId in slotsData) {
      const turfSlotData = slotsData[turfId];
      if (!turfSlotData || !turfSlotData.slots) continue;
      const slots = turfSlotData.slots;
      for (const dateStr of Object.keys(slots)) {
        if (new Date(dateStr) < cutoff) {
          remove(ref(database, `turf/${turfId}/slots/${dateStr}`)).catch((e) => console.error('cleanup slot remove', e));
        }
      }
    }
  };

  useEffect(() => {
    const slotRef = ref(database, 'turf');
    const cleanupListener = onValue(slotRef, (snapshot) => {
      const allData = snapshot.val() || {};
      setTurfSlots(allData);
      cleanupOldSlots(allData);
    });

    return () => cleanupListener();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [turf, search]);

  useEffect(() => {
    const SPORTS = ["cricket", "football", "basketball", "badminton"];
    setLoading(true);
    const getData = async () => {
      try {
        let allData = [];
        // Fetch all data for all sports if needed
        if (turf === "All") {
          for (const s of SPORTS) {
            const turfData = await getDocs(collection(db, s));
            allData = allData.concat(
              turfData.docs.map((doc) => ({ ...doc.data(), id: doc.id, sport: s }))
            );
          }
        } else {
          const turfData = await getDocs(collection(db, turf));
          allData = turfData.docs.map((doc) => ({ ...doc.data(), id: doc.id, sport: turf }));
        }

       let filterData = allData;

// Sport filter
if (turf !== "All") {
  filterData = filterData.filter((d) => d.sport === turf);
}

// Search filter
if (search && search.trim()) {
  const query = search.toLowerCase().trim();

  filterData = filterData.filter((d) => {
    return (
      d.name?.toLowerCase().includes(query) ||
      d.address?.toLowerCase().includes(query) ||
      d.sport?.toLowerCase().includes(query)
    );
  });
}
        // else: both 'All', show everything

        setData(filterData);
        setLoading(false);
      } catch (err) {
        setError(err.message || "Failed to load turfs");
        setLoading(false);
      }
    };
    getData();
  }, [turf, search]);
  console.log(turfName);
  //  console.log(time,element)
   localStorage.setItem("time",time)

  if (loading) {
    return <div id="turfContainer">
         <Loading/>;
      </div>
  }
  if (error) {
    return (
      <div id="turfContainer">
        <p style={{color: 'red', textAlign: 'center'}}>{error}</p>
      </div>
    )
  }
 console.log(error);
  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleData = data.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      <p className="heading-turf">Turf Available for {turf}</p>
      <div className="turf-container">
        {visibleData.map((ele) => {
          return (
            <div className="turf-box" key={ele.id}>
              <div className="listing-img" onClick={() => { setSelectedTurf(ele); setIsChartOpen(true); }} style={{ cursor: 'pointer' }}>
                <img src={ele.image} alt={ele.name} />
              </div>
              <div className="turf-card-body">
                <p className="turf-name">{ele.name}</p>
                <p className="turf-address">{ele.address}</p>

                <div className="turf-actions">
                  <TimeSelectModal turf={turf} element={ele} turfName={turfName} setTurfName={setTurfName} setElement={setElement} setTime={setTime} id={ele.id} />
                  <button
                    className="view-slots-btn"
                    onClick={() => { setSelectedTurf(ele); setIsChartOpen(true); }}
                  >
                    VIEW AVAILABLE SLOT
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {data.length > itemsPerPage && (
        <div className="pagination-bar">
          <button
            type="button"
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          >
            Previous
          </button>
          <span className="pagination-info">Page {currentPage} of {totalPages}</span>
          <button
            type="button"
            className="pagination-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          >
            Next
          </button>
        </div>
      )}

      {selectedTurf && (
        <div className="slot-chart-modal" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: isChartOpen ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', zIndex: 1999, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #111318 100%)', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '1000px', maxHeight: '85vh', overflowY: 'auto', border: '1px solid #1e293b', boxShadow: '0 20px 60px rgba(0,0,0,0.9)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#ff6b6b', margin: 0, fontSize: '20px', fontWeight: 'bold' }}>{selectedTurf.name} - 7 Day Slot Chart</h2>
              <button style={{ color: 'white', background: 'transparent', border: '2px solid #ef4444', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s' }} onClick={() => setIsChartOpen(false)}>✕ Close</button>
            </div>
            <p style={{ color: '#cbd5e1', marginTop: '0', marginBottom: '16px', fontSize: '13px' }}>Click on any time slot to mark as booked. Chart updates in real-time.</p>
            {(() => {
              const { dates, matrix } = getSlotMatrix(selectedTurf.id);
              return (
                <div style={{ overflowX: 'auto', marginTop: '10px' }}>
                  <div style={{ display: 'grid', gap: '2px', background: '#0f172a', gridTemplateColumns: `140px repeat(${dates.length}, minmax(120px, 1fr))` }}>
                    <div style={{ background: '#1e293b', color: '#ef4444', padding: '10px 8px', fontWeight: 'bold', textAlign: 'center', fontSize: '12px' }}>Slot / Day</div>
                    {dates.map((d) => (
                      <div key={d.dateKey} style={{ background: '#1e293b', color: '#fff', padding: '10px 8px', textAlign: 'center', border: '1px solid #0e172a' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{d.dayName}</div>
                        <div style={{ fontSize: '11px', color: '#a0aec0' }}>{d.dateKey}</div>
                        <div style={{ fontSize: '10px', marginTop: '4px', color: '#16a34a' }}>✓ {d.availableCount}</div>
                      </div>
                    ))}

                    {matrix.map((row) => (
                      <React.Fragment key={row.slot}>
                        <div style={{ background: '#1e293b', color: '#cbd5e1', padding: '10px 8px', fontWeight: 'bold', textAlign: 'center', fontSize: '11px' }}>
                          {row.slot}
                        </div>
                        {row.cells.map((cell) => (
                          <div
                            key={`${row.slot}-${cell.date}`}
                            style={{
                              background: cell.booked ? '#dc2626' : '#16a34a',
                              color: 'white',
                              padding: '10px 8px',
                              textAlign: 'center',
                              fontWeight: 'bold',
                              border: '1px solid #0e172a',
                              fontSize: '11px',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.opacity = '0.8'}
                            onMouseOut={(e) => e.target.style.opacity = '1'}
                          >
                            {cell.booked ? '✗' : '✓'}
                          </div>
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
};
