export async function verifyMpesaPayment(referenceNumber) {
    try {
      // Implement MPesa payment verification logic here
      // You'll need to integrate with MPesa's API
      // This is a placeholder that always returns true
      return true;
    } catch (error) {
      console.error('MPesa verification error:', error);
      return false;
    }
  }