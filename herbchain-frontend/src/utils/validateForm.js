export const validateBatchForm = (formData) => {
  const errors = {};

  // Herb name validation (support both herbName and herb fields)
  const herbName = formData.herbName || formData.herb;
  if (!herbName || herbName.trim() === '') {
    errors.herbName = 'Herb name is required';
    errors.herb = 'Herb name is required';
  }

  // Location validation
  if (!formData.location || formData.location.trim() === '') {
    errors.location = 'Location is required';
  }

  // Moisture validation (support both moisturePercent and moisture fields)
  const moisture = formData.moisturePercent || formData.moisture;
  if (!moisture) {
    errors.moisturePercent = 'Moisture content is required';
    errors.moisture = 'Moisture content is required';
  } else {
    const moistureValue = parseFloat(moisture);
    if (isNaN(moistureValue) || moistureValue < 0 || moistureValue > 100) {
      errors.moisturePercent = 'Moisture content must be between 0% and 100%';
      errors.moisture = 'Moisture content must be between 0% and 100%';
    }
  }

  // Notes validation
  if (!formData.notes || formData.notes.trim() === '') {
    errors.notes = 'Additional notes are required';
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