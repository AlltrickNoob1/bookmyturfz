/*
  Admin page - Turf & Booking Management
*/
import React, { useCallback, useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase-config/config";
import { database } from "../firebase-config/config";
import { ref, onValue, update, remove, set } from "firebase/database";
import { useUserAuth } from "../context/Authcontext";
import {
  Box,
  Button,
  Input,
  Select,
  Image,
  SimpleGrid,
  Text,
  Stack,
  Heading,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import * as authUtils from "../utils/authUtils.js";

const SPORTS = ["cricket", "football", "basketball", "badminton"];

export const Admin = () => {
  const { user, logout } = useUserAuth();
  const toast = useToast();
  const adminEmail = authUtils.getConfiguredAdminEmail();

  const isSuperAdmin = user && authUtils.isMatchingAdminEmail(user.email, adminEmail);
  const canEdit = isSuperAdmin;

  const [sport, setSport] = useState(SPORTS[0]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState(0);
  const [image, setImage] = useState("");
  const [turfs, setTurfs] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [selectedBooking, setSelectedBooking] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [searchName, setSearchName] = useState("");
  const [searchAddress, setSearchAddress] = useState("");
  const [searchSportFilter, setSearchSportFilter] = useState("");
  const [searchPriceMin, setSearchPriceMin] = useState("");
  const [searchPriceMax, setSearchPriceMax] = useState("");
  const [currentTurfPage, setCurrentTurfPage] = useState(1);
  const TURFS_PER_PAGE = 9;


  // State for edit turf modal
  const [editingTurf, setEditingTurf] = useState(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPrice, setEditPrice] = useState(0);
  const [editImage, setEditImage] = useState("");
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();

  const navigate = useNavigate();

  // Fetch all turfs
  const fetchAll = useCallback(async () => {
    try {
      const results = [];
      for (const s of SPORTS) {
        const ref = collection(db, s);
        const snap = await getDocs(ref);
        snap.docs.forEach((d) => {
          results.push({ id: d.id, sport: s, ...d.data() });
        });
      }
      setTurfs(results);
      setCurrentTurfPage(1);
    } catch (err) {
      console.error("failed to fetch turfs", err);
      toast({ title: "Failed to load turfs", status: "error", duration: 4000 });
    }
  }, [toast]);

  // Fetch all bookings from all users
  const fetchAllBookings = useCallback(() => {
    const usersRef = ref(database, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setAllBookings([]);
        return;
      }

      const bookings = [];
      const seenBookingIds = new Set(); // Track booking IDs we've already added
      
      Object.entries(data).forEach(([userId, userData]) => {
// Skip current data booking (users/{id}/data) to avoid stale pushed rows that stay on top.
      // Only use booking history from users/{id}/bookings so ordering by createdAt is stable.
      // (If you want current booking in future, add a separate table.)

        // Add historical bookings (excluding those already shown as current)
        if (userData.bookings) {
          Object.entries(userData.bookings).forEach(([bookingKey, booking]) => {
            if (!booking || !booking.bookingId || !booking.bookingDate || !booking.time) {
              // skip grossly invalid entries
              return;
            }

            // Skip duplicates by bookingId
            if (seenBookingIds.has(booking.bookingId)) {
              return;
            }

            const turfName = booking.turfName || booking.booking?.name || booking.booking?.turfName || 'Unknown Turf';
            const userEmail = booking.email || booking.userEmail || booking.booking?.email || 'Unknown Email';
            const userName = booking.booking?.name || booking.booking?.customerName || booking.userName || 'Unknown';

            const createdAt = booking.createdAt || (() => {
              try {
                const bid = booking.bookingId || '';
                const ts = bid.split('_').pop();
                const n = parseInt(ts, 10);
                return Number.isFinite(n) ? n : Date.now();
              } catch (e) { return Date.now(); }
            })();

            const turfId = booking.turfId || booking.booking?.id || booking.booking?.turfId || null;

            bookings.push({
              userId,
              userName,
              userEmail,
              turfName,
              turfId,
              bookingDate: booking.bookingDate || 'N/A',
              time: booking.time || 'N/A',
              amount: booking.amount || 0,
              paymentStatus: booking.paymentStatus || 'Pending',
              approvalStatus: booking.approvalStatus || 'Pending',
              bookingId: booking.bookingId,
              path: `users/${userId}/bookings/${bookingKey}`,
              type: 'history',
              createdAt
            });

            seenBookingIds.add(booking.bookingId);

          });
        }
      });

      // sort newest first by createdAt
      bookings.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setAllBookings(bookings);
      // keep current page so the admin stays on same page after approve/reject/delete
    });
  }, []);

  useEffect(() => {
    fetchAll();
    fetchAllBookings();
  }, [fetchAll, fetchAllBookings]);

  if (!user) {
    return <Text color="white" fontSize="xl" textAlign="center" mt={10}>Please log in to access admin panel.</Text>;
  }
  if (!canEdit) {
    return <Text color="red.300" fontSize="xl" textAlign="center" mt={10}>Access denied: only admin/sub-admins are allowed.</Text>;
  }

  const handleApprove = async (booking) => {
    try {
      if (!booking) return;

      if (isBookingPast(booking)) {
        toast({ title: 'Cannot approve', description: 'Booking time has already passed (timeout).', status: 'warning' });
        return;
      }

      if (isSlotAlreadyFull(booking)) {
        const dbRef = ref(database, booking.path);
        await update(dbRef, { approvalStatus: 'Rejected' });
        toast({ title: 'Slot Full', description: 'This slot has already been approved for another booking. Booking rejected.', status: 'error' });
        onClose();
        fetchAllBookings();
        return;
      }

      const dbRef = ref(database, booking.path);
      await update(dbRef, { approvalStatus: 'Approved' });

      // Also ensure the turf slot is marked booked in realtime turf slot map
      const activeTurfId = booking.turfId || booking.booking?.id || booking.booking?.turfId;
      if (activeTurfId && booking.bookingDate && booking.time) {
        const slotRefPath = `turf/${activeTurfId}/slots/${booking.bookingDate}/${booking.time}`;
        await set(ref(database, slotRefPath), 'booked');
      }

      // send email notification to user
      try {
        await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/email/send-booking-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            booking: booking,
            action: 'Approved',
          }),
        });
      } catch (emailErr) {
        console.error('Could not send approval email:', emailErr);
      }

      toast({ title: 'Booking Approved!', status: 'success' });
      onClose();
      fetchAllBookings();
    } catch (err) {
      console.error('Error approving booking:', err);
      toast({ title: 'Failed to approve', description: err.message, status: 'error' });
    }
  };

  const handleReject = async (booking) => {
    try {
      if (!booking) return;

      if (isBookingPast(booking)) {
        toast({ title: 'Cannot reject', description: 'Booking time has already passed (timeout).', status: 'warning' });
        return;
      }

      const dbRef = ref(database, booking.path);
      await update(dbRef, { approvalStatus: 'Rejected' });

      // If a slot was marked booked, free it when booking is rejected
      const activeTurfId = booking.turfId || booking.booking?.id || booking.booking?.turfId;
      if (activeTurfId && booking.bookingDate && booking.time) {
        const slotPath = `turf/${activeTurfId}/slots/${booking.bookingDate}/${booking.time}`;
        await remove(ref(database, slotPath));
      }

      try {
        await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/email/send-booking-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            booking: booking,
            action: 'Rejected',
          }),
        });
      } catch (emailErr) {
        console.error('Could not send rejection email:', emailErr);
      }

      toast({ title: 'Booking Rejected!', status: 'success' });
      onClose();
      fetchAllBookings();
    } catch (err) {
      console.error('Error rejecting booking:', err);
      toast({ title: 'Failed to reject', description: err.message, status: 'error' });
    }
  };


  const handleDeleteBooking = async (booking) => {
    if (!canEdit) {
      toast({ title: "Not authorised", status: "error", duration: 3000 });
      return;
    }
    try {
      const dbRef = ref(database, booking.path);
      await remove(dbRef);
      toast({ title: "Booking deleted", status: "success" });
      onClose();
      fetchAllBookings();
    } catch (err) {
      console.error('Error deleting booking:', err);
      toast({ title: 'Delete failed', description: err.message, status: 'error' });
    }
  };

  async function handleAdd(e) {
    e.preventDefault();
    if (!canEdit) {
      toast({ title: "Not authorised", status: "error", duration: 3000 });
      return;
    }
    if (!name) return toast({ title: "Enter name", status: "warning" });
    try {
      const ref = collection(db, sport);
      await addDoc(ref, { name: name.toUpperCase(), address: address.toUppercase(), image, price: Number(price) });
      toast({ title: "Turf added", status: "success" });
      setName("");
      setAddress("");
      setImage("");
      setPrice(0);
      fetchAll();
    } catch (err) {
      console.error(err);
      const isPerm = err?.code === "permission-denied" || (err?.message && err.message.includes("Permission"));
      toast({
        title: isPerm ? "Permission denied" : "Failed to add turf",
        description: err?.message,
        status: "error",
        duration: 6000,
      });
    }
  }

  async function handleDelete(t) {
    if (!canEdit) {
      toast({ title: "Not authorised", status: "error", duration: 3000 });
      return;
    }
    try {
      await deleteDoc(doc(db, t.sport, t.id));
      toast({ title: "Deleted", status: "success" });
      fetchAll();
    } catch (err) {
      console.error(err);
      const isPerm = err?.code === "permission-denied" || (err?.message && err.message.includes("Permission"));
      toast({
        title: isPerm ? "Permission denied" : "Failed to delete",
        description: err?.message,
        status: "error",
        duration: 6000,
      });
    }
  }

  function openEditModal(t) {
    setEditingTurf(t);
    setEditName(t.name);
    setEditAddress(t.address);
    setEditPrice(t.price);
    setEditImage(t.image);
    onEditOpen();
  }

  async function handleUpdate() {
    if (!canEdit) {
      toast({ title: "Not authorised", status: "error", duration: 3000 });
      return;
    }
    if (!editingTurf) return;

    try {
      const turfRef = doc(db, editingTurf.sport, editingTurf.id);
      await updateDoc(turfRef, {
        name: editName.toUpperCase(),
        address: editAddress.toUpperCase(),
        price: Number(editPrice),
        image: editImage,
      });
      toast({ title: "Turf updated successfully", status: "success" });
      onEditClose();
      fetchAll();
    } catch (err) {
      console.error(err);
      const isPerm = err?.code === "permission-denied" || (err?.message && err.message.includes("Permission"));
      toast({
        title: isPerm ? "Permission denied" : "Failed to update turf",
        description: err?.message,
        status: "error",
        duration: 6000,
      });
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'Approved': return 'green';
      case 'Rejected': return 'red';
      case 'Pending': return 'yellow';
      default: return 'gray';
    }
  };

  const getTimeAsDate = (timeStr, dateStr) => {
    if (!timeStr || !dateStr) return null;
    const [timePart, period] = timeStr.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    const date = new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
    return date;
  };

  const isBookingPast = (booking) => {
    const slotDatetime = getTimeAsDate(booking.time, booking.bookingDate);
    if (!slotDatetime) return false;
    return slotDatetime < new Date();
  };

  const isSlotAlreadyFull = (booking) => {
    if (!booking || !booking.bookingDate || !booking.time || !booking.turfName) return false;
    const approvedSameSlot = allBookings.filter((b) =>
      b.bookingId !== booking.bookingId &&
      b.turfName === booking.turfName &&
      b.bookingDate === booking.bookingDate &&
      b.time === booking.time &&
      b.approvalStatus === 'Approved'
    );
    return approvedSameSlot.length > 0;
  };

  const normalize = (value = "") => value.toString().toLowerCase();
  const minPrice = parseFloat(searchPriceMin);
  const maxPrice = parseFloat(searchPriceMax);

  const filteredTurfs = turfs.filter((t) => {
    const nameMatch = normalize(t.name).includes(normalize(searchName));
    const addressMatch = normalize(t.address).includes(normalize(searchAddress));
    const sportMatch = searchSportFilter ? t.sport === searchSportFilter : true;
    const priceMatch = (!isNaN(minPrice) ? t.price >= minPrice : true) && (!isNaN(maxPrice) ? t.price <= maxPrice : true);
    return nameMatch && addressMatch && sportMatch && priceMatch;
  });

  const totalTurfPages = Math.max(1, Math.ceil(filteredTurfs.length / TURFS_PER_PAGE));
  const turfStartIndex = (currentTurfPage - 1) * TURFS_PER_PAGE;
  const pageTurfs = filteredTurfs.slice(turfStartIndex, turfStartIndex + TURFS_PER_PAGE);

  return (
    <Box p={6} maxW="1400px" mx="auto" bg="gray.900" minH="100vh">
      <Stack mb={6} spacing={3}>
        <Heading size="lg" color="white">Admin Panel</Heading>
        <Text color="gray.300">Logged in as: {user ? user.email : "Not logged in"}</Text>
        <Text fontSize="sm" color="gray.500">Configured admin: {adminEmail}</Text>

        <Box>
          <Menu>
            <MenuButton as={Button} rightIcon={<span style={{fontWeight:'bold'}}>&#9660;</span>} size="sm" variant="outline" mr={2}>
              Admin Actions
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => navigate('/change-password')}>Change Password</MenuItem>
              <MenuItem onClick={async () => { await logout(); navigate('/login'); }}>Logout</MenuItem>
            </MenuList>
          </Menu>
          {user && user.email !== adminEmail && (
            <Text color="orange.300" mt={2}>You are not the configured admin. Sign in as {adminEmail} to manage.</Text>
          )}
        </Box>
      </Stack>

      <Tabs>
        <TabList mb={4} borderBottomColor="gray.600">
          <Tab color="gray.300" _selected={{ color: 'red.500', borderBottomColor: 'red.500' }}>Turfs</Tab>
          <Tab color="gray.300" _selected={{ color: 'red.500', borderBottomColor: 'red.500' }}>Bookings</Tab>
        </TabList>

        <TabPanels>
          {/* TURFS TAB */}
          <TabPanel>
            <Box as="form" onSubmit={handleAdd} mb={8}>
              <SimpleGrid columns={[1, 2, 5]} gap={4}>
                <Select value={sport} onChange={(e) => setSport(e.target.value)} bg="gray.800" color="white" borderColor="gray.600">
                  {SPORTS.map((s) => (
                    <option key={s} value={s} style={{ background: '#2d3748', color: 'white' }}>
                      {s}
                    </option>
                  ))}
                </Select>
                <Input placeholder="Turf Name" value={name} onChange={(e) => setName(e.target.value)} bg="gray.800" color="white" borderColor="gray.600" />
                <Input placeholder="Location" value={address} onChange={(e) => setAddress(e.target.value)} bg="gray.800" color="white" borderColor="gray.600" />
                <Input placeholder="Price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} bg="gray.800" color="white" borderColor="gray.600" />
                <Input placeholder="Image URL" value={image} onChange={(e) => setImage(e.target.value)} bg="gray.800" color="white" borderColor="gray.600" />
                <Box>
                  {image && <Image src={image} alt="preview" maxH="160px" objectFit="cover" mb={2} />}
                  <Button colorScheme="blue" type="submit" isDisabled={!canEdit}>Add Turf</Button>
                </Box>
              </SimpleGrid>
            </Box>

            <Heading size="md" mb={4} color="white">All Turfs</Heading>

            <Stack direction={["column", "column", "row"]} spacing={3} mb={4} align="center">
              <Input
                placeholder="Search by name"
                value={searchName}
                onChange={(e) => { setSearchName(e.target.value); setCurrentTurfPage(1); }}
                bg="gray.800"
                color="white"
                borderColor="gray.600"
                size="sm"
              />
              <Input
                placeholder="Search by address"
                value={searchAddress}
                onChange={(e) => { setSearchAddress(e.target.value); setCurrentTurfPage(1); }}
                bg="gray.800"
                color="white"
                borderColor="gray.600"
                size="sm"
              />
              <Select
                value={searchSportFilter}
                onChange={(e) => { setSearchSportFilter(e.target.value); setCurrentTurfPage(1); }}
                bg="gray.800"
                color="white"
                borderColor="gray.600"
                size="sm"
              >
                <option value="">All Sports</option>
                {SPORTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
              <Input
                placeholder="Price min"
                type="number"
                value={searchPriceMin}
                onChange={(e) => { setSearchPriceMin(e.target.value); setCurrentTurfPage(1); }}
                bg="gray.800"
                color="white"
                borderColor="gray.600"
                size="sm"
              />
              <Input
                placeholder="Price max"
                type="number"
                value={searchPriceMax}
                onChange={(e) => { setSearchPriceMax(e.target.value); setCurrentTurfPage(1); }}
                bg="gray.800"
                color="white"
                borderColor="gray.600"
                size="sm"
              />
            </Stack>

            <SimpleGrid columns={[1, 2, 3]} spacing={4}>
              {pageTurfs.length === 0 ? (
                <Box bg="gray.800" p={4} borderRadius="md" colSpan={3}>
                  <Text color="gray.400" textAlign="center">No turfs found matching your search.</Text>
                </Box>
              ) : (
                pageTurfs.map((t) => (
                  <Box key={`${t.sport}-${t.id}`} bg="gray.800" p={3} borderRadius="md" borderLeft="4px" borderColor="red.500">
                    {t.image && <Image src={t.image} alt={t.name} h="160px" objectFit="cover" mb={3} w="100%" />}
                    <Text fontWeight="bold" color="white">{t.name}</Text>
                    <Text fontSize="sm" color="gray.300">Location: {t.address}</Text>
                    <Text color="green.300">₹{t.price} / hour</Text>
                    <Text fontSize="xs" color="gray.400">Sport: {t.sport}</Text>
                    <Stack direction="row" mt={3} gap={2}>
                      <Button colorScheme="blue" onClick={() => openEditModal(t)} isDisabled={!canEdit} size="sm" flex={1}>Update</Button>
                      <Button colorScheme="red" onClick={() => handleDelete(t)} isDisabled={!canEdit} size="sm" flex={1}>Delete</Button>
                    </Stack>
                  </Box>
                ))
              )}
            </SimpleGrid>

            {filteredTurfs.length > TURFS_PER_PAGE && (
              <Box mt={4} display="flex" justifyContent="center" alignItems="center" gap={2}>
                <Button size="sm" onClick={() => setCurrentTurfPage((p) => Math.max(1, p - 1))} isDisabled={currentTurfPage === 1}>
                  Prev
                </Button>
                <Text color="gray.300" fontSize="sm">
                  Page {currentTurfPage} / {totalTurfPages}
                </Text>
                <Button size="sm" onClick={() => setCurrentTurfPage((p) => Math.min(totalTurfPages, p + 1))} isDisabled={currentTurfPage === totalTurfPages}>
                  Next
                </Button>
              </Box>
            )}

          </TabPanel>

          {/* BOOKINGS TAB */}
          <TabPanel>
            <Heading size="md" mb={4} color="white">All Bookings</Heading>
            <Box overflowX="auto" bg="gray.800" borderRadius="md" p={3}>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr borderBottomColor="gray.600">
                    <Th color="gray.300">Customer Name</Th>
                    <Th color="gray.300">Email</Th>
                    <Th color="gray.300">Turf</Th>
                    <Th color="gray.300">Date</Th>
                    <Th color="gray.300">Time</Th>
                    <Th color="gray.300">Booked At</Th>
                    <Th color="gray.300">Amount</Th>
                    <Th color="gray.300">Payment Status</Th>
                    <Th color="gray.300">Approval Status</Th>
                    <Th color="gray.300">Action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {allBookings.length === 0 ? (
                    <Tr>
                      <Td colSpan={10} textAlign="center" color="gray.400" py={8}>
                        No bookings yet
                      </Td>
                    </Tr>
                  ) : (
                    // paginate
                    (() => {
                      const start = (currentPage - 1) * ITEMS_PER_PAGE;
                      const pageItems = allBookings.slice(start, start + ITEMS_PER_PAGE);
                      return pageItems.map((booking, idx) => (
                        <Tr key={start + idx} borderBottomColor="gray.600" _hover={{ bg: 'gray.700' }}>
                          <Td color="white">{booking.userName}</Td>
                          <Td color="gray.300" fontSize="sm">{booking.userEmail}</Td>
                          <Td color="white">{booking.turfName}</Td>
                          <Td color="gray.300">{booking.bookingDate}</Td>
                          <Td color="gray.300">{booking.time}</Td>
                          <Td color="gray.400" fontSize="xs">{new Date(booking.createdAt).toLocaleString('en-IN')}</Td>
                          <Td color="green.300">₹{booking.amount}</Td>
                          <Td>
                            <Badge colorScheme={booking.paymentStatus === 'Confirmed' ? 'green' : 'yellow'}>
                              {booking.paymentStatus}
                            </Badge>
                          </Td>
                          <Td>
                            <Badge colorScheme={getStatusColor(booking.approvalStatus)}>
                              {booking.approvalStatus}
                            </Badge>
                          </Td>
                          <Td>
                            <Stack direction="row" spacing={1}>
                              {isBookingPast(booking) ? (
                                <Text fontSize="xs" color="orange.300">Timeout</Text>
                              ) : booking.approvalStatus === 'Pending' ? (
                                <Button 
                                  size="xs" 
                                  colorScheme="blue" 
                                  onClick={() => {
                                    setSelectedBooking(booking);
                                    onOpen();
                                  }}
                                >
                                  Review
                                </Button>
                              ) : (
                                <Text fontSize="xs" color="gray.400">
                                  {booking.approvalStatus}
                                </Text>
                              )}
                              <Button
                                size="xs"
                                colorScheme="red"
                                onClick={() => handleDeleteBooking(booking)}
                              >
                                Delete
                              </Button>
                            </Stack>
                          </Td>
                        </Tr>
                      ));
                    })()
                  )}
                </Tbody>
              </Table>
            </Box>
            {/* Pagination controls */}
            {allBookings.length > ITEMS_PER_PAGE && (
              <Box mt={3} display="flex" alignItems="center" justifyContent="flex-end" gap={2}>
                <Button size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} isDisabled={currentPage === 1}>Prev</Button>
                <Text color="gray.300" fontSize="sm">Page {currentPage} / {Math.max(1, Math.ceil(allBookings.length / ITEMS_PER_PAGE))}</Text>
                <Button size="sm" onClick={() => setCurrentPage((p) => Math.min(Math.ceil(allBookings.length / ITEMS_PER_PAGE), p + 1))} isDisabled={currentPage === Math.ceil(allBookings.length / ITEMS_PER_PAGE)}>Next</Button>
              </Box>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Review Booking Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent bg="gray.800">
          <ModalHeader color="white">Review Booking</ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody>
            {selectedBooking && isBookingPast(selectedBooking) && (
              <Alert status="warning" mb={3} borderRadius="md">
                <AlertIcon />
                This booking has expired (time out). Approval/rejection is disabled.
              </Alert>
            )}
            {selectedBooking && (
              <Stack spacing={3}>
                <Box>
                  <Text color="gray.300" fontSize="sm">Customer Name</Text>
                  <Text color="white" fontWeight="bold">{selectedBooking.userName}</Text>
                </Box>
                <Box>
                  <Text color="gray.300" fontSize="sm">Email</Text>
                  <Text color="white">{selectedBooking.userEmail}</Text>
                </Box>
                <Box>
                  <Text color="gray.300" fontSize="sm">Turf Booked</Text>
                  <Text color="white" fontWeight="bold">{selectedBooking.turfName}</Text>
                </Box>
                <Box>
                  <Text color="gray.300" fontSize="sm">Date & Time</Text>
                  <Text color="white">{selectedBooking.bookingDate} at {selectedBooking.time}</Text>
                </Box>
                <Box>
                  <Text color="gray.300" fontSize="sm">Booked At</Text>
                  <Text color="white" fontSize="sm">{new Date(selectedBooking.createdAt).toLocaleString('en-IN')}</Text>
                </Box>
                <Box>
                  <Text color="gray.300" fontSize="sm">Amount</Text>
                  <Text color="green.300" fontWeight="bold">₹{selectedBooking.amount}</Text>
                </Box>
                <Box>
                  <Text color="gray.300" fontSize="sm">Payment Status</Text>
                  <Badge colorScheme={selectedBooking.paymentStatus === 'Confirmed' ? 'green' : 'yellow'}>
                    {selectedBooking.paymentStatus}
                  </Badge>
                </Box>
              </Stack>
            )}
          </ModalBody>
          <ModalFooter gap={2}>
            <Button
              colorScheme="red"
              onClick={() => handleReject(selectedBooking)}
              isDisabled={selectedBooking && isBookingPast(selectedBooking)}
            >
              Reject
            </Button>
            <Button
              colorScheme="green"
              onClick={() => handleApprove(selectedBooking)}
              isDisabled={selectedBooking && (isBookingPast(selectedBooking) || isSlotAlreadyFull(selectedBooking))}
            >
              Approve
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Turf Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} isCentered>
        <ModalOverlay />
        <ModalContent bg="gray.800">
          <ModalHeader color="white">Update Turf</ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody>
            {editingTurf && (
              <Stack spacing={3}>
                <Box>
                  <Text color="gray.300" fontSize="sm" mb={1}>Turf Name</Text>
                  <Input 
                    placeholder="Turf Name" 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)} 
                    bg="gray.700" 
                    color="white" 
                    borderColor="gray.600"
                  />
                </Box>
                <Box>
                  <Text color="gray.300" fontSize="sm" mb={1}>Location</Text>
                  <Input 
                    placeholder="Location" 
                    value={editAddress} 
                    onChange={(e) => setEditAddress(e.target.value)} 
                    bg="gray.700" 
                    color="white" 
                    borderColor="gray.600"
                  />
                </Box>
                <Box>
                  <Text color="gray.300" fontSize="sm" mb={1}>Price (₹/hour)</Text>
                  <Input 
                    placeholder="Price" 
                    type="number" 
                    value={editPrice} 
                    onChange={(e) => setEditPrice(e.target.value)} 
                    bg="gray.700" 
                    color="white" 
                    borderColor="gray.600"
                  />
                </Box>
                <Box>
                  <Text color="gray.300" fontSize="sm" mb={1}>Image URL</Text>
                  <Input 
                    placeholder="Image URL" 
                    value={editImage} 
                    onChange={(e) => setEditImage(e.target.value)} 
                    bg="gray.700" 
                    color="white" 
                    borderColor="gray.600"
                  />
                </Box>
                {editImage && (
                  <Box>
                    <Text color="gray.300" fontSize="sm" mb={1}>Preview</Text>
                    <Image src={editImage} alt="preview" maxH="200px" objectFit="cover" borderRadius="md" />
                  </Box>
                )}
              </Stack>
            )}
          </ModalBody>
          <ModalFooter gap={2}>
            <Button colorScheme="gray" onClick={onEditClose}>Cancel</Button>
            <Button colorScheme="green" onClick={handleUpdate}>Update</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Admin;
