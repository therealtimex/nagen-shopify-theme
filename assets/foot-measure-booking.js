/**
 * Foot Measure Booking Form JavaScript
 * Handles form validation, location type switching, and async submission
 */

(function() {
  'use strict';

  // Initialize all booking forms on the page
  document.querySelectorAll('.fmb-form').forEach(initBookingForm);

  function initBookingForm(form) {
    const sectionId = form.dataset.sectionId;
    const submitBtn = form.querySelector('.fmb-form__submit');
    const submitText = form.querySelector('.fmb-form__submit-text');
    const submitLoading = form.querySelector('.fmb-form__submit-loading');
    const successMessage = form.querySelector('.fmb-form__success');
    const formFields = form.querySelector('.fmb-form__fields');
    
    // Location type elements
    const locationRadios = form.querySelectorAll('.fmb-form__radio[name="locationType"]');
    const officeContainer = form.querySelector('.fmb-form__location-office');
    const homeContainer = form.querySelector('.fmb-form__location-home');
    const storeSelect = form.querySelector('.fmb-form__select[name="selectedOffice"]');
    const addressInput = form.querySelector('.fmb-form__input[name="address"]');

    // Handle location type change
    locationRadios.forEach(radio => {
      radio.addEventListener('change', function() {
        const locationType = this.value;
        
        // Reset and hide both containers
        officeContainer.style.display = 'none';
        homeContainer.style.display = 'none';
        
        // Clear previous values
        if (storeSelect) storeSelect.value = '';
        if (addressInput) addressInput.value = '';
        
        // Clear errors
        clearError('selectedOffice', form);
        clearError('address', form);
        
        // Show appropriate container
        if (locationType === 'office') {
          officeContainer.style.display = 'block';
        } else if (locationType === 'home') {
          homeContainer.style.display = 'block';
        }
      });
    });

    // Form submission
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Clear all errors
      clearAllErrors(form);
      
      // Validate form
      if (!validateForm(form)) {
        return;
      }
      
      // Show loading state
      setLoadingState(true);
      
      try {
        const formData = collectFormData(form);
        
        const response = await fetch(
          'https://workflow.realtimex.co/api/v1/executions/webhook/flowai/nagen_website_datlich/input',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
          }
        );
        
        if (!response.ok) {
          throw new Error('Có lỗi khi gửi dữ liệu');
        }
        
        // Show success message
        showSuccess();
        
      } catch (error) {
        console.error('Form submission error:', error);
        // Show generic error (could be enhanced with specific error display)
        alert('Có lỗi xảy ra. Vui lòng thử lại sau.');
      } finally {
        setLoadingState(false);
      }
    });

    function validateForm(form) {
      let isValid = true;
      
      // Name validation
      const name = form.querySelector('[name="name"]').value.trim();
      if (!name) {
        showError('name', 'Vui lòng nhập họ và tên', form);
        isValid = false;
      }
      
      // Birth date validation
      const birthDate = form.querySelector('[name="birthDate"]').value;
      if (!birthDate) {
        showError('birthDate', 'Vui lòng chọn ngày sinh', form);
        isValid = false;
      }
      
      // Phone validation
      const phone = form.querySelector('[name="phone"]').value.trim();
      if (!phone) {
        showError('phone', 'Vui lòng nhập số điện thoại', form);
        isValid = false;
      } else if (!/^[0-9+\-\s()]{9,15}$/.test(phone)) {
        showError('phone', 'Số điện thoại không hợp lệ', form);
        isValid = false;
      }
      
      // Email validation
      const email = form.querySelector('[name="email"]').value.trim();
      if (!email) {
        showError('email', 'Vui lòng nhập email', form);
        isValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('email', 'Email không hợp lệ', form);
        isValid = false;
      }
      
      // Location type validation
      const locationType = form.querySelector('[name="locationType"]:checked');
      if (!locationType) {
        showError('locationType', 'Vui lòng chọn địa điểm đo chân', form);
        isValid = false;
      } else {
        if (locationType.value === 'office') {
          const selectedOffice = form.querySelector('[name="selectedOffice"]').value;
          if (!selectedOffice) {
            showError('selectedOffice', 'Vui lòng chọn địa điểm', form);
            isValid = false;
          }
        } else if (locationType.value === 'home') {
          const address = form.querySelector('[name="address"]').value.trim();
          if (!address) {
            showError('address', 'Vui lòng nhập địa chỉ', form);
            isValid = false;
          }
        }
      }
      
      return isValid;
    }

    function collectFormData(form) {
      const locationType = form.querySelector('[name="locationType"]:checked');
      
      const data = {
        event: 'dochan',
        name: form.querySelector('[name="name"]').value.trim(),
        birthDate: form.querySelector('[name="birthDate"]').value,
        phone: form.querySelector('[name="phone"]').value.trim(),
        email: form.querySelector('[name="email"]').value.trim(),
        locationType: locationType ? locationType.value : '',
        selectedOffice: '',
        address: '',
        source_url: window.location.href,
        ctv: getUrlParam('ctv') || '',
      };
      
      if (locationType) {
        if (locationType.value === 'office') {
          data.selectedOffice = form.querySelector('[name="selectedOffice"]').value;
        } else if (locationType.value === 'home') {
          data.address = form.querySelector('[name="address"]').value.trim();
        }
      }
      
      return data;
    }

    function showError(fieldName, message, form) {
      const errorEl = form.querySelector(`.fmb-form__error[data-field="${fieldName}"]`);
      const inputEl = form.querySelector(`[name="${fieldName}"]`);
      
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('visible');
      }
      
      if (inputEl) {
        inputEl.classList.add('error');
      }
    }

    function clearError(fieldName, form) {
      const errorEl = form.querySelector(`.fmb-form__error[data-field="${fieldName}"]`);
      const inputEl = form.querySelector(`[name="${fieldName}"]`);
      
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.remove('visible');
      }
      
      if (inputEl) {
        inputEl.classList.remove('error');
      }
    }

    function clearAllErrors(form) {
      form.querySelectorAll('.fmb-form__error').forEach(el => {
        el.textContent = '';
        el.classList.remove('visible');
      });
      form.querySelectorAll('.error').forEach(el => {
        el.classList.remove('error');
      });
    }

    function setLoadingState(loading) {
      submitBtn.disabled = loading;
      submitText.style.display = loading ? 'none' : 'inline';
      submitLoading.style.display = loading ? 'flex' : 'none';
      
      // Hide icon button during loading
      const iconBtn = submitBtn.querySelector('.icon-button');
      if (iconBtn) {
        iconBtn.style.display = loading ? 'none' : 'flex';
      }
    }

    function showSuccess() {
      formFields.style.display = 'none';
      successMessage.style.display = 'block';
      
      // Scroll to success message
      successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function getUrlParam(param) {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(param);
    }
  }
})();
