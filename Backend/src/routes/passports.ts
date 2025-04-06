// Scan a passport (simulate barcode scanning)
router.post('/scan', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Always set to Inscan, ignoring any scanType in the request
    const scanType = 'Inscan';
    
    // Generate a random passport ID based on scan type
    const passportId = generatePassportId(scanType);
    
    res.json({
      passportId,
      scanType,
      status: 'Pending',
      message: 'Passport scanned successfully'
    });
  } catch (error) {
    console.error('Scan passport error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}); 