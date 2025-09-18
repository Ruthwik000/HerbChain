export const validateBatchForm = (formData) => {
  const errors = {};

  // Herb validation
  if (!formData.herb || formData.herb.trim() === '') {
    errors.herb = 'Herb selection is required';
  }

  // Location validation
  if (!formData.location || formData.location.trim() === '') {
    errors.location = 'Location is required';
  }

  // Moisture validation
  if (!formData.moisture) {
    errors.moisture = 'Moisture content is required';
  } else {
    const moisture = parseFloat(formData.moisture);
    if (isNaN(moisture) || moisture < 0 || moisture > 15) {
      errors.moisture = 'Moisture content must be between 0% and 15%';
    }
    // Note: We allow moisture > 10% but it will be flagged in the UI
  }

  // Harvest date validation
  if (!formData.harvestDate) {
    errors.harvestDate = 'Harvest date is required';
  } else {
    const harvestDate = new Date(formData.harvestDate);
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    if (harvestDate > today) {
      errors.harvestDate = 'Harvest date cannot be in the future';
    } else if (harvestDate < thirtyDaysAgo) {
      errors.harvestDate = 'Harvest date cannot be more than 30 days ago';
    }
  }

  // Photo validation (optional but if provided, should be valid)
  if (formData.photo && typeof formData.photo === 'object') {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(formData.photo.type)) {
      errors.photo = 'Please select a valid image file (JPG, PNG, GIF, WebP)';
    } else if (formData.photo.size > 10 * 1024 * 1024) {
      errors.photo = 'File size must be less than 10MB';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateLoginForm = (formData) => {
  const errors = {};

  if (!formData.username || formData.username.trim() === '') {
    errors.username = 'Username is required';
  }

  if (!formData.password || formData.password.trim() === '') {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};