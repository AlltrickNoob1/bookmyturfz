import React, { useState, useEffect } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
import { Link } from "react-router-dom";
import { useUserAuth } from "../context/Authcontext";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase-config/config";
import { Text } from "@chakra-ui/react";
import "../style/bookings.css";
import { BookingSkeleton } from "../components/BookingSkeleton";
export const Bookings = () => {
  const { user} = useUserAuth();
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [add, setAdd] = useState("");
  const [time, setTime] = useState("");
  const [date,setDate] = useState("")
  const [paymentStatus, setPaymentStatus] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("");
  const [bookingHistory, setBookingHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(0);

  // Function to display a booking in the current section
  const displayBooking = (booking) => {
    setName(booking.booking?.name || '');
    setImage(booking.booking?.image || '');
    setAdd(booking.booking?.address || '');
    setTime(booking.time || '');
    setDate(booking.bookingDate || '');
    setPaymentStatus(booking.paymentStatus || 'Pending');
    setApprovalStatus(booking.approvalStatus || 'Pending');
    setAmount(booking.amount || 0);
    window.scrollTo(0, 0); // Scroll to top
  };


  const getUserData = (uid) => {
    setLoading(true);
    const userRef = ref(database, "users/" + uid);
    onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      
      if (data === null) {
        setLoading(false);
        return;
      }
      
      // Set current booking from /data if it exists
      if (data.data) {
        const bookingName = data.data;
        setName(bookingName.booking.name);
        setImage(bookingName.booking.image);
        setAdd(bookingName.booking.address);
        setTime(bookingName.time);
        setDate(bookingName.bookingDate);
        setPaymentStatus(bookingName.paymentStatus || 'Pending');
        setApprovalStatus(bookingName.approvalStatus || 'Pending');
      }
      
      // Filter booking history: keep only bookings within 48 hours
      if (data.bookings) {
        const now = Date.now();
        const fortyEightHours = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
        
        const historyArray = Object.entries(data.bookings)
          .map(([key, val]) => ({
            id: key,
            ...val
          }))
          .filter(booking => {
            // Keep booking if it was created within last 48 hours
            if (booking.createdAt) {
              const ageInMs = now - booking.createdAt;
              return ageInMs <= fortyEightHours;
            }
            return true; // Keep bookings without timestamp for backward compatibility
          })
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); // Sort newest first
        
        setBookingHistory(historyArray);
      } else {
        setBookingHistory([]);
      }
      
      setLoading(false);
    });
  };
  
  useEffect(() => {
    if (user) {
      getUserData(user.uid);
    }
  }, [user]);

  // const handleLogout = async () => {
  //   try {
  //     await logout();
  //   } catch (err) {
  //     console.log(err.message);
  //   }
  // };
  const BookingDiv = () => {
    const hasCurrentBooking = name && image;
    const hasHistory = bookingHistory.length > 0;
    
    if (!hasCurrentBooking && !hasHistory) {
      return (
        <div id="errorOrder">
          <Text
            fontSize={"28px"}
            textAlign="center"
            marginTop={"50px"}
            fontWeight="bold"
          >
            No Bookings found
          </Text>
        </div>
      );
    }
    
    return (
      <div className="booking-page">
        {/* Current Booking Section */}
        {hasCurrentBooking && (
          <>
            <h2 className="booking-title">Current Booking</h2>
            <div className="booking-card">
              <div className="booking-image">
                <img src={image} alt={name} />
              </div>
              <div className="booking-body">
                <h3 className="booking-name">{name}</h3>
                <p className="booking-address"><strong>Address:</strong> {add}</p>
                <p className="booking-time"><strong>Time:</strong> {time}</p>
                <p className="booking-date"><strong>Date:</strong> {date}</p>
                {amount > 0 && <p className="booking-status"><strong>Amount:</strong> <span style={{color: '#48bb78', fontWeight: 'bold', marginLeft: '8px'}}>₹{amount}</span></p>}
                <p className="booking-status"><strong>Payment Status:</strong> <span style={{padding: '4px 8px', borderRadius: '4px', backgroundColor: paymentStatus === 'Confirmed' ? '#48bb78' : '#ed8936', color: 'white', marginLeft: '8px'}}>{paymentStatus}</span></p>
                <p className="booking-status"><strong>Admin Approval:</strong> <span style={{padding: '4px 8px', borderRadius: '4px', backgroundColor: approvalStatus === 'Approved' ? '#48bb78' : approvalStatus === 'Rejected' ? '#f56565' : '#ecc94b', color: approvalStatus === 'Rejected' ? 'white' : 'black', marginLeft: '8px'}}>{approvalStatus}</span></p>
              </div>
            </div>
          </>
        )}
        
        {/* Booking History Section */}
        {hasHistory && (
          <>
            <h2 className="booking-title" style={{ marginTop: '32px' }}>Booking History</h2>
            <div className="booking-history">
              {bookingHistory.map((booking) => (
                <div 
                  className="booking-history-card" 
                  key={booking.id}
                  onClick={() => displayBooking(booking)}
                  style={{cursor: 'pointer', transition: 'all 0.3s ease', border: '2px solid transparent'}}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
                    e.currentTarget.style.borderColor = '#f56565';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <div className="history-card-image">
                    <img src={booking.booking?.image || 'https://via.placeholder.com/150'} alt={booking.booking?.name} />
                  </div>
                  <div className="history-card-body">
                    <h4 className="history-card-name">{booking.booking?.name}</h4>
                    <p className="history-card-address"><strong>Address:</strong> {booking.booking?.address}</p>
                    <p className="history-card-time"><strong>Time:</strong> {booking.time}</p>
                    <p className="history-card-date"><strong>Date:</strong> {booking.bookingDate}</p>
                    <p className="history-card-status"><strong>Payment Status:</strong> <span className="status-badge">{booking.paymentStatus || 'Pending'}</span></p>
                    <p className="history-card-status"><strong>Admin Approval:</strong> <span className="status-badge" style={{backgroundColor: booking.approvalStatus === 'Approved' ? '#48bb78' : booking.approvalStatus === 'Rejected' ? '#f56565' : '#ecc94b', color: booking.approvalStatus === 'Rejected' ? 'white' : 'black'}}>{booking.approvalStatus || 'Pending'}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div>
      <div id="paymentNav">
        <Link to={"/turf"}>
          <IoMdArrowRoundBack fontWeight={"bold"} fontSize="30px" />
        </Link>
        <Text color={"red"} fontSize="30px" fontWeight={"bold"}>
          Bookings
        </Text>
      </div>
      {loading ? <BookingSkeleton /> : <BookingDiv />}
    </div>
  );
};
