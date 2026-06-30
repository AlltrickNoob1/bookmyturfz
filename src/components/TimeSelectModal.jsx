import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useDisclosure,
  Text,
  Alert,
  AlertIcon,
  Box,
  Input
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useUserAuth } from "../context/Authcontext";
import { ref, set, onValue } from "firebase/database";
import { database } from "../firebase-config/config";

const time = [
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

// Helper function to convert time string to Date object
const getTimeAsDate = (timeStr, dateStr) => {
  const [timePart, period] = timeStr.split(' ');
  let [hours, minutes] = timePart.split(':').map(Number);
  
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  const date = new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
  return date;
};

// Check if a time slot is in the past
const isTimePast = (timeStr, dateStr) => {
  if (!dateStr) return false;
  const slotDateTime = getTimeAsDate(timeStr, dateStr);
  const now = new Date();
  return slotDateTime < now;
};
export const TimeSelectModal = (prop) => {
  const { turf, element, setElement, setTime, setTurfName, turfName } = prop;
  const { user } = useUserAuth();

  const OverlayTwo = () => (
    <ModalOverlay
      bg="none"
      backdropFilter="auto"
      backdropInvert="80%"
      backdropBlur="2px"
    />
  );
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [overlay] = React.useState(<OverlayTwo />);
  const [bookedtime, setBookedTime] = useState([]);
  const [link, setlink] = useState(false);
  const [msg, setMsg] = useState(false);
  const [err, setErr] = useState(false);
  const [date,setDate] = useState("");
  const [turfBookedSlots, setTurfBookedSlots] = useState({});

  const handleElement = (ele) => {
    setElement(ele);
    setTurfName(ele.name)
  };
  // const bookedTimeLs = localStorage.getItem("time", time);
  // console.log(bookedTime)
  const navigate = useNavigate();
  // add bookings to user account
  // NOTE: previously this replaced the whole user node which deleted the
  // bookings history. Only write the active booking under /users/<uid>/data

// console.log(date)
  // const getBookings = () => {
  //   let arr = [];
  //   const Leaveref = ref(database, `users/`);
  //   onValue(Leaveref, (snapshot) => {
  //     const data = snapshot.val();
  //     const newLeave = Object.keys(data).map((key) => ({
  //       id: key,
  //       ...data[key],
  //     }));
  //     newLeave.map((ele) => {
  //       return arr.push(ele.data.time);
  //     });
  //   });
  //   setBookedTime(arr);
  // };
  useEffect(() => {
    const Leaveref = ref(database, `users/`);
    let arr = [];
    onValue(Leaveref, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        // no bookings yet
        setBookedTime([]);
        return;
      }
      const newLeave = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));
      newLeave.forEach((ele) => {
        if (ele.data) {
          arr.push(ele.data);
        }
      });
      setBookedTime(arr);
    });
  }, []);

  useEffect(() => {
    if (!element || !element.id) return;
    const slotRef = ref(database, `turf/${element.id}/slots`);
    console.log('Setting up realtime listener for:', `turf/${element.id}/slots`);
    const unsubscribe = onValue(slotRef, (snapshot) => {
      const val = snapshot.val() || {};
      console.log('Realtime slot update received:', val);
      setTurfBookedSlots(val);
    }, (error) => {
      console.error('Error listening to slots:', error);
    });
    return () => unsubscribe();
  }, [element]);

  const addBookings = async (ele) => {
    try {
      const userAuth = await user;
      const now = Date.now();
      var bookingData = {
        booking: element,
        time: ele,
        uid: userAuth.uid,
        email: userAuth.email,
        bookingDate : date,
        bookingId: `${userAuth.uid}_${now}`,
        amount: element.price,
        turfId: element.id,
        paymentStatus: 'Pending',
        approvalStatus: 'Pending',
        paymentId: null,
        orderId: null,
        createdAt: now
      };
      console.log('Booking data being saved:', bookingData);
      console.log('Element price:', element.price);
      console.log('Element:', element);
      
      if (bookedtime.find((e) => 
        e.time === ele && 
        e.bookingDate === date && 
        e.turfId === element.id
      )) {
        setlink(false)
        setErr(true)
      } else {
        try {
          // Store pending booking locally and go to payment
          localStorage.setItem('pendingBooking', JSON.stringify({
            ...bookingData,
            paymentMethod: 'Pay Online',
            paymentStatus: 'Pending'
          }));
          setMsg(true);
          setlink(true);
          console.log('Pending booking saved to localStorage, ready to move to payment');
        } catch (error) {
          console.error('Error saving pending booking:', error);
          alert('Failed to prepare booking. Please try again.\n\nError: ' + error.message);
          setlink(false)
          setErr(true)
        }
      }
    } catch (err) {
      console.log(err);
      alert('Error creating booking: ' + err.message);
    }
  };

  // Navigate when link is true (use effect to avoid setState during render)
  useEffect(() => {
    if (link) {
      navigate("/payment");
    }
  }, [link, navigate]);

  return (
    <>
      <Button
        colorScheme={"red"}
        size="lg"
        width="100%"
        fontWeight="700"
        fontSize="14px"
        letterSpacing="0.5px"
        _hover={{
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 20px rgba(239, 68, 68, 0.6)',
        }}
        onClick={() => {
          handleElement(element);
          onOpen();
        }}
      >
        📅 Book Now
      </Button>
      <Modal isCentered isOpen={isOpen} onClose={onClose}>
        {overlay}
        <ModalContent>
          <ModalHeader>Timings For {turf}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box>
             
              {msg ? (
                <div className={msg ? "alertMsg" : "alertErr"}>
                  <Alert status="success">
                    <AlertIcon />
                    Booked successfully
                  </Alert>
                </div>
              ) : (
                <div className={err ? "errmsg" : "errFalse"}>
                  <Alert status="error">
                    <AlertIcon />
                     This Slot is already Booked
                  </Alert>
                </div>
              )}
            </Box>
            <Text fontWeight={"bold"} fontSize="25px" color={"red"}>Booking for "{turfName}"</Text>
            <Text fontWeight={"bold"} fontSize="25px">Select Date</Text>
            <Input 
              type={"date"} 
              min={new Date().toISOString().split('T')[0]}
              onChange={(e)=>setDate(e.target.value)}
              value={date}
            />
            <Text fontWeight={"bold"} fontSize="25px">
              Select Time
            </Text>
            <div id="timeButtons">
              {time.map((ele, idx) => {
                const isPast = isTimePast(ele, date);
                const slotBooked = date && turfBookedSlots[date] && turfBookedSlots[date][ele] === 'booked';
                return (
                  <Button
                    key={idx}
                    colorScheme={slotBooked ? 'red' : 'green'}
                    isDisabled={isPast || slotBooked}
                    opacity={isPast || slotBooked ? 0.6 : 1}
                    cursor={isPast || slotBooked ? 'not-allowed' : 'pointer'}
                    onClick={() => {
                      if (!isPast && !slotBooked) {
                        setTime(ele);
                        addBookings(ele);
                      }
                    }}
                    title={isPast ? "This slot has already passed" : slotBooked ? "This slot is already booked" : ""}
                  >
                    {slotBooked ? 'Booked' : ele} {isPast ? "(Passed)" : ''}
                  </Button>
                );
              })}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
