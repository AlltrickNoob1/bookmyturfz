import React, { useState } from "react";
import { Box, Button, Input, Stack, Heading, Text, useToast } from "@chakra-ui/react";
import { useUserAuth } from "../context/Authcontext";
import { auth } from "../firebase-config/config";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  sendPasswordResetEmail,
} from "firebase/auth";

export const ChangePassword = () => {
  const { user } = useUserAuth();
  const toast = useToast();
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(false);

  const hasPasswordProvider = user?.providerData?.some((p) => p.providerId === "password");

  async function handleChange(e) {
    e.preventDefault();
    if (!user) return toast({ title: "Not signed in", status: "error" });
    if (!currentPwd) return toast({ title: "Enter current password", status: "warning" });
    if (!newPwd || newPwd.length < 6) return toast({ title: "Enter new password (>=6 chars)", status: "warning" });
    if (newPwd !== confirmPwd) return toast({ title: "Passwords do not match", status: "warning" });
    setLoading(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPwd);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, newPwd);
      toast({ title: "Password updated", status: "success" });
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to change password", description: err?.message, status: "error", duration: 6000 });
    } finally {
      setLoading(false);
    }
  }

  async function handleSendReset() {
    if (!user?.email) return toast({ title: "No email available", status: "error" });
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({ title: "Password reset email sent", status: "success" });
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to send reset email", description: err?.message, status: "error" });
    }
  }

  return (
    <Box maxW="480px" mx="auto" mt={8} p={4}>
      <Heading size="md" mb={4}>Change Password</Heading>
      {!user ? (
        <Text>You must be signed in to change your password.</Text>
      ) : (
        <>
          {hasPasswordProvider ? (
            <Box as="form" onSubmit={handleChange}>
              <Stack spacing={3}>
                <Input placeholder="Current password" type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} />
                <Input placeholder="New password" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
                <Input placeholder="Confirm new password" type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
                <Button colorScheme="red" type="submit" isLoading={loading}>Change Password</Button>
              </Stack>
            </Box>
          ) : (
            <Box>
              <Text mb={3}>Your account uses an external provider (Google). You can send a password reset email to set a password for this account.</Text>
              <Button colorScheme="red" onClick={handleSendReset}>Send password reset email</Button>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default ChangePassword;
