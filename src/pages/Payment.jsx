import React, { useEffect, useState } from 'react'
import "../style/payment.css"
import {IoMdArrowRoundBack} from "react-icons/io"
import { Link } from 'react-router-dom'
import { useUserAuth } from '../context/Authcontext'
import { ref, onValue, set } from "firebase/database";
import { database } from '../firebase-config/config'
import { Button, Text, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, useDisclosure, Box } from '@chakra-ui/react'
import { PopoverProfile } from '../components/Popover'
import { TimeSelectModal } from '../components/TimeSelectModal'

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

export const Payment = () => {
  const {user} = useUserAuth();
  const [name,setName] = useState("")
  const [time,setTime] = useState("")
  const [amount, setAmount] = useState(0)
  const [bookingData, setBookingData] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('qr')
  const [bookedAt, setBookedAt] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showConflictModal, setShowConflictModal] = useState(false)
  const [showSlotModal, setShowSlotModal] = useState(false)
  const toast = useToast()
  const markSlot = async (booking) => {
    if (!booking?.turfId || !booking?.bookingDate || !booking?.time) return
    try {
      await set(ref(database, `turf/${booking.turfId}/slots/${booking.bookingDate}/${booking.time}`), 'booked')
      console.log('Slot marked booked for', booking.turfId, booking.bookingDate, booking.time)
    } catch (err) {
      console.error('Failed to mark slot:', err)
      throw err
    }
  }

  const saveBookingToHistory = async (data) => {
    if (!user || !user.uid) {
      return Promise.reject(new Error('User not authenticated'))
    }
    const bookingRef = ref(database, `users/${user.uid}/bookings/${data.bookingId}`)
    const dataRef = ref(database, `users/${user.uid}/data`)
    return Promise.all([set(bookingRef, data), set(dataRef, data)])
  }

  const finalizeBooking = async (method, status, paymentUpdate = {}) => {
    if (!bookingData) {
      throw new Error('No booking data available')
    }

    const updated = {
      ...bookingData,
      paymentMethod: method,
      paymentStatus: status,
      bookingTimestamp: new Date().toLocaleString(),
      ...paymentUpdate,
    }

    await markSlot(updated)
    await saveBookingToHistory(updated)

    // Send transactional emails
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/email/send-booking-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking: updated }),
      })
    } catch (error) {
      console.error('Error sending booking email to user:', error)
    }

    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/email/send-admin-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking: updated }),
      })
    } catch (error) {
      console.error('Error sending admin booking notification:', error)
    }

    localStorage.removeItem('pendingBooking')

    setBookingData(updated)
    setName(updated.booking?.name || updated.bookingName || '')
    setTime(updated.time || '')
    setAmount(updated.amount || 0)
    setBookedAt(updated.bookingTimestamp)

    return updated
  }
  const getUserData = (uid) => {
       const userRef = ref(database,"users/"+ uid);
       onValue(userRef,(snapshot)=>{
        const data = snapshot.val();
        console.log('Raw data from Firebase:', data);
        if(data===null || !data.data){
          console.log('No booking data found')
          return
        }else{
          const bookingInfo = data.data
          console.log('Booking info:', bookingInfo);
          console.log('Amount from DB:', bookingInfo.amount);
          setBookingData(bookingInfo)
          setName(bookingInfo.booking?.name || '')
          setTime(bookingInfo.time || '')
          setAmount(bookingInfo.amount || 0)
        }
        
       })
  }
  useEffect(()=>{
    if(!user) return;

    const pending = localStorage.getItem('pendingBooking');
    if(pending){
      try{
        const pendingBooking = JSON.parse(pending);
        setBookingData(pendingBooking);
        setName(pendingBooking.booking?.name || '');
        setTime(pendingBooking.time || '');
        setAmount(pendingBooking.amount || 0);
        return;
      }catch(e){
        console.error('Invalid pending booking data in localStorage', e);
        localStorage.removeItem('pendingBooking');
      }
    }

    getUserData(user.uid)
  },[user])

  const OverlayOne = () => (
    <ModalOverlay
      bg='blackAlpha.300'
      backdropFilter='blur(10px) hue-rotate(90deg)'
    />
  )

  const OverlayTwo = () => (
    <ModalOverlay
      bg='none'
      backdropFilter='auto'
      backdropInvert='80%'
      backdropBlur='2px'
    />
  )

  const { isOpen, onOpen, onClose } = useDisclosure()
  const [overlay, setOverlay] = React.useState(<OverlayOne />)

  const handleRazorpayPayment = async () => {
    if (!bookingData || !bookingData.bookingId) {
      toast({ title: 'Error', description: 'Booking data not found', status: 'error' })
      return
    }

    // Validate booking data
    if (!bookingData.amount || bookingData.amount === 0) {
      toast({ title: 'Error', description: 'Invalid booking amount', status: 'error' })
      console.error('Invalid booking data:', bookingData)
      return
    }

    setLoading(true)
    try {
      console.log('Creating order with data:', {
        amount: bookingData.amount,
        bookingId: bookingData.bookingId,
        userEmail: bookingData.email,
        turfId: bookingData.turfId,
        bookingDate: bookingData.bookingDate,
        time: bookingData.time,
        userId: bookingData.uid,
      })

      // Step 1: Create Razorpay Order on Backend
      const orderResponse = await fetch(`${BACKEND_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: bookingData.amount,
          bookingId: bookingData.bookingId,
          userEmail: bookingData.email,
          turfId: bookingData.turfId,
          bookingDate: bookingData.bookingDate,
          time: bookingData.time,
          userId: bookingData.uid,
        }),
      })

      console.log('Order response status:', orderResponse.status)

      if (orderResponse.status === 409) {
        // Turf already booked for this slot
        setShowConflictModal(true)
        setLoading(false)
        return
      }

      if (orderResponse.status === 400) {
        const errorData = await orderResponse.json()
        toast({ title: 'Validation Error', description: errorData.error || 'Invalid booking data', status: 'error' })
        console.error('Validation error:', errorData)
        setLoading(false)
        return
      }

      if (orderResponse.status === 500) {
        const errorData = await orderResponse.json()
        toast({ title: 'Server Error', description: errorData.error || errorData.details || 'Failed to create payment order', status: 'error' })
        console.error('Server error:', errorData)
        setLoading(false)
        return
      }

      const orderData = await orderResponse.json()
      console.log('Order data received:', orderData)
      
      if (!orderData.success) {
        toast({ title: 'Error', description: orderData.error || orderData.message || 'Failed to create order', status: 'error' })
        console.error('Order creation failed:', orderData)
        setLoading(false)
        return
      }

      // If we are in mock mode (keys not configured), skip Razorpay modal and mark payment success directly
      if (orderData._mock) {
        console.log('Using mock Razorpay flow (dev mode).')
        await handlePaymentSuccess({
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: 'mock_signature',
        })
        return
      }

      // Step 2: Load Razorpay Script
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      document.head.appendChild(script)

      script.onload = () => {
        console.log('Razorpay script loaded, opening checkout modal')
        
        // Step 3: Open Razorpay Checkout
        if (!process.env.REACT_APP_RAZORPAY_KEY_ID) {
          toast({ title: 'Config Missing', description: 'Set REACT_APP_RAZORPAY_KEY_ID in frontend .env', status: 'error' })
          setLoading(false)
          return
        }

        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID,
          order_id: orderData.orderId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'Turfz Booking',
          description: `Booking for ${name}`,
          prefill: {
            email: bookingData.email,
            contact: user.phoneNumber || '',
          },
          theme: {
            color: '#F37254',
          },
          handler: handlePaymentSuccess,
          modal: {
            ondismiss: () => {
              setLoading(false)
              toast({ title: 'Payment Cancelled', status: 'warning' })
            }
          }
        }

        console.log('Opening Razorpay with options:', options)
        const rzp = new window.Razorpay(options)
        rzp.open()
      }
      
      script.onerror = () => {
        console.error('Razorpay script failed to load')
        toast({ title: 'Error', description: 'Failed to load Razorpay payment gateway', status: 'error' })
        setLoading(false)
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast({ title: 'Error', description: error.message, status: 'error' })
      setLoading(false)
    }
  }

  // Handle successful payment
  const handlePaymentSuccess = async (response) => {
    try {
      // Step 4: Verify Payment on Backend
      const verifyResponse = await fetch(`${BACKEND_URL}/api/payment/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
          bookingId: bookingData.bookingId,
        }),
      })

      const verifyData = await verifyResponse.json()

      if (verifyData.success) {
        const timestamp = new Date().toLocaleString();
        setBookedAt(timestamp);
        // Step 5: Update Booking Status in Database using helper

        await saveBookingToHistory({
          status: 'Confirmed',
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
        })

        try {
          await finalizeBooking('Pay Online', 'Confirmed', {
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            paymentStatus: 'Confirmed',
          })

          toast({ 
            title: 'Payment Successful!', 
            description: 'Your booking has been confirmed', 
            status: 'success',
            duration: 5,
            isClosable: true 
          })

          setLoading(false)
          setOverlay(<OverlayTwo />)
          onOpen()
        } catch (error) {
          console.error('Finalizing booking failed:', error)
          toast({ title: 'Error', description: 'Could not finalize booking. Please contact support.', status: 'error' })
          setLoading(false)
          return
        }
      } else {
        toast({ title: 'Verification Failed', description: verifyData.message, status: 'error' })
        setLoading(false)
      }
    } catch (error) {
      console.error('Verification error:', error)
      toast({ title: 'Error', description: 'Payment verification failed', status: 'error' })
      setLoading(false)
    }
  }

  return (
    <div id='paymentContainer'>
          <div id="paymentNav">
            <Link to={"/turf"}>
             <IoMdArrowRoundBack fontWeight={"bold"} fontSize="30px"/>
             </Link>
             <p id='BookedTurfName'>{name}</p>
             <PopoverProfile email={user ? user.email : ''}/>
          </div>
          <div id='paymentContainerBox'>
            <div id='paymentMode'>
            <Text className="payment-header" fontWeight={"bold"} fontSize="28px">Pay Now</Text>
            <Text className="payment-amount" fontSize="18px">Amount: <span style={{ color: '#ef4444' }}>₹{amount}</span></Text>

            <Box mt={3} mb={2} p={3} borderRadius="12px" bg="#121212" border="1px solid #2a2a2a">
              <Text fontSize="13px" color="#9ca3af" mb={1}>Booking Summary</Text>
              <Text fontSize="14px" color="#e5e7eb">Turf: {bookingData?.booking?.name || name || 'N/A'}</Text>
              <Text fontSize="14px" color="#e5e7eb">Date: {bookingData?.bookingDate || 'N/A'}</Text>
              <Text fontSize="14px" color="#e5e7eb">Slot: {bookingData?.time || time || 'N/A'}</Text>
              <Text fontSize="14px" color="#e5e7eb">Booked By: {bookingData?.email || user?.email || 'N/A'}</Text>
              <Text fontSize="14px" color="#e5e7eb">Pay Method: {bookingData?.paymentMethod || (paymentMethod==='qr' ? 'Pay Online' : 'Pay with Cash')}</Text>
              <Text fontSize="14px" color="#e5e7eb">Payment Status: {bookingData?.paymentStatus || 'Pending'}</Text>
              <Text fontSize="14px" color="#9ca3af">Booked At: {bookingData?.bookingTimestamp || bookedAt || 'N/A'}</Text>
            </Box>
            
            {/* Test Card Info */}
            {process.env.NODE_ENV === 'development' && (
              <Box mt={6} p={3} className="testCardBox">
                <Text fontSize="sm" fontWeight="bold" color="#fca5a5">ℹ️ Test Mode</Text>
                <Text fontSize="xs" mt={2} color="#fca5a5">
                  Card: 4111111111111111 | CVV: 123 | Date: 12/25
                </Text>
              </Box>
            )}
            
            <Box mt={6}>
              <div className="payment-methods">
                {/* Pay Online Option */}
                <div 
                  className={`payment-option-label ${paymentMethod === 'qr' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('qr')}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: '2px solid #ef4444',
                    backgroundColor: paymentMethod === 'qr' ? '#ef4444' : 'transparent',
                    marginRight: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                  }}>
                    {paymentMethod === 'qr' && <div style={{ width: '6px', height: '6px', backgroundColor: 'white', borderRadius: '50%' }}></div>}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>💳 Pay Online</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>UPI • Card • Wallet • Net Banking</div>
                  </div>
                </div>

                {/* Pay with Cash Option */}
                <div 
                  className={`payment-option-label ${paymentMethod === 'cash' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('cash')}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: '2px solid #ef4444',
                    backgroundColor: paymentMethod === 'cash' ? '#ef4444' : 'transparent',
                    marginRight: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                  }}>
                    {paymentMethod === 'cash' && <div style={{ width: '6px', height: '6px', backgroundColor: 'white', borderRadius: '50%' }}></div>}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>💵 Pay with Cash</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>Pay at counter / Manual</div>
                  </div>
                </div>
              </div>
            </Box>
      <Button
        onClick={async () => {
          if (paymentMethod === 'qr') {
            handleRazorpayPayment()
          } else {
            // For cash payment, save booking immediately
            setLoading(true)
            try {
              await finalizeBooking('Pay with Cash', 'Pending - Cash Payment')
              setLoading(false)
              setOverlay(<OverlayTwo />)
              onOpen()
            } catch (err) {
              toast({ title: 'Error', description: 'Failed to save booking', status: 'error' })
              setLoading(false)
            }
          }
        }}
        colorScheme="red"
        mt={6}
        isLoading={loading}
        width="100%"
        size="lg"
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </Button>
      <Modal isCentered isOpen={isOpen} onClose={onClose}>
        {overlay}
        <ModalContent>
          <ModalHeader>Order Booked</ModalHeader>
          <ModalBody bg="#0f172a" borderRadius="12px" p={4}>
            <Text fontSize="lg" fontWeight="bold" color="#fff" mb={2}>Thanks for booking {bookingData?.booking?.name || name}</Text>
            <Text fontSize="14px" color="#d1d5db">Email: {bookingData?.email || user?.email || 'N/A'}</Text>
            <Text fontSize="14px" color="#d1d5db">Turf: {bookingData?.booking?.name || name || 'N/A'}</Text>
            <Text fontSize="14px" color="#d1d5db">Date: {bookingData?.bookingDate || 'N/A'}</Text>
            <Text fontSize="14px" color="#d1d5db">Slot: {bookingData?.time || time || 'N/A'}</Text>
            <Text fontSize="14px" color="#d1d5db">Booked At: {bookingData?.bookingTimestamp || bookedAt || new Date().toLocaleString()}</Text>
            <Text fontSize="14px" color="#d1d5db">Payment Method: {bookingData?.paymentMethod || (paymentMethod==='qr' ? 'Pay Online' : 'Pay with Cash')}</Text>
            <Text mt={4} fontWeight="bold" color={bookingData?.paymentStatus?.toLowerCase().includes('pending') ? '#fbbf24' : '#34d399'}>
              Payment Status: {bookingData?.paymentStatus || 'Pending'}
            </Text>
          </ModalBody>
          <ModalFooter>
            <Link to="/turf">
            <Button onClick={onClose} colorScheme="red">Back to Turfs</Button>
            </Link>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Booking Conflict Modal */}
      <Modal isOpen={showConflictModal} onClose={() => setShowConflictModal(false)} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontWeight="bold" color="red.500">Turf Slot Busy</ModalHeader>
          <ModalBody>
            <Text fontSize="lg" mb={2}>Bro, please choose another time. This turf is busy at your selected slot.</Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="red" onClick={() => {
              setShowConflictModal(false);
              setShowSlotModal(true);
            }}>OK</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Slot Selection Modal (reuse your slot picker/modal) */}
      {showSlotModal && (
        <TimeSelectModal isOpen={showSlotModal} onClose={() => setShowSlotModal(false)} />
      )}
             </div>
          </div>
    </div>
  )
}
