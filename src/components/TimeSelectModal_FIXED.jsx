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
  "5:00 AM",
  "7:00 AM",
  "9:00 AM",
  "4:00 PM",
  "6:00 PM",
  "8:00 PM",
  "10:00AM",
];
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
  const [date,setDate] = useState("")

  const handleElement = (ele) => {
    setElement(ele);
    setTurfName(ele.name)
  };
  // const bookedTimeLs = localStorage.getItem("time", time);
  // console.log(bookedTime)
  const navigate = useNavigate();
  // add bookings to user account - FIXED: only set /data, not the entire user node
  function writeUserData(data) {
    set(ref(database, "users/" + user.uid + "/data"), data);
  }

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
      newLeave.map((ele) => {
       return arr.push(ele.data);
      });
      setBookedTime(arr);
    });
  },[]);

  const addBookings = async (ele) => {
    try {
      const userAuth = await user;
      var bookingData = {
        booking: element,
        time: ele,
        uid: userAuth.uid,
        email: userAuth.email,
        bookingDate : date,
        bookingId: `${userAuth.uid}_${Date.now()}`,
        amount: element.price,
        paymentStatus: 'Pending',
        paymentId: null,
        orderId: null
      };
      if (bookedtime.find((e) =>e.time === ele && e.bookingDate=== date && e.booking.name===turfName) ) {
        setlink(false)
        setErr(true)
      } else {
        setlink(true)
        writeUserData(bookingData);
        setMsg(true)
      }
    } catch (err) {
      console.log(err);
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
        onClick={() => {
          handleElement(element);
          onOpen();
        }}
      >
        Book Now
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
            <Input type={"date"} onChange={(e)=>setDate(e.target.value)}/>
            <Text fontWeight={"bold"} fontSize="25px">
              Select Time
            </Text>
            <div id="timeButtons">
              {time.map((ele, idx) => {
                return (
                  <Button
                    key={idx}
                    colorScheme={"red"}
                    onClick={() => {
                      setTime(ele);
                      addBookings(ele);
                    }}
                  >
                    {ele}
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
