/* eslint-disable @typescript-eslint/no-explicit-any */
export async function verifyMpesaPayment(referenceNumber:any) {
    try {
      // Implement MPesa payment verification logic here
      // You'll need to integrate with MPesa's API
      // This is a placeholder that always returns true
      console.log(referenceNumber)
      return true;
    } catch (error) {
      console.error('MPesa verification error:', error);
      return false;
    }
  }