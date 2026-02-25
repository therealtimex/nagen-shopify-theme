/**
 * Consultation Booking Form JavaScript
 * Keeps the legacy UnifiedRegistrationForm logic in a Shopify section context.
 */

(function() {
  'use strict';

  document.querySelectorAll('.cfb-form').forEach(initConsultationForm);

  function initConsultationForm(form) {
    const submitBtn = form.querySelector('.cfb-form__submit');
    const submitText = form.querySelector('.cfb-form__submit-text');
    const submitLoading = form.querySelector('.cfb-form__submit-loading');
    const successMessage = form.querySelector('.cfb-form__success');
    const successProductMessage = form.querySelector('.cfb-form__success-message--product');
    const successDealerLine1 = form.querySelector('.cfb-form__success-message--dealer-line-1');
    const successDealerLine2 = form.querySelector('.cfb-form__success-message--dealer-line-2');
    const successEmailNote = form.querySelector('.cfb-form__success-email-note');
    const successEmail = form.querySelector('.cfb-form__success-email');
    const successResetButton = form.querySelector('.cfb-form__success-reset');
    const formFields = form.querySelector('.cfb-form__fields');
    const consultationRadios = form.querySelectorAll('[name="consultationType"]');
    const optionsWrap = form.querySelector('[data-field-wrap="consultationType"]');

    applyDefaultConsultationType(form);

    consultationRadios.forEach(function(radio) {
      radio.addEventListener('change', function() {
        clearError('consultationType', form);
      });
    });

    if (successResetButton) {
      successResetButton.addEventListener('click', function() {
        resetForm();
      });
    }

    form.addEventListener('submit', async function(event) {
      event.preventDefault();

      clearAllErrors(form);

      if (!validateForm(form)) {
        return;
      }

      setLoadingState(true);

      try {
        const submissionData = collectFormData(form);
        const apiUrl = getApiUrl(submissionData.consultationType);

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submissionData),
        });

        if (!response.ok) {
          throw new Error('Có lỗi khi gửi dữ liệu');
        }

        showSuccess(submissionData);
      } catch (error) {
        console.error('Consultation form submission error:', error);
      } finally {
        setLoadingState(false);
      }
    });

    function validateForm(formElement) {
      let isValid = true;

      const consultationType = formElement.querySelector('[name="consultationType"]:checked');
      const name = formElement.querySelector('[name="name"]').value.trim();
      const phone = formElement.querySelector('[name="phone"]').value.trim();
      const email = formElement.querySelector('[name="email"]').value.trim();

      if (!consultationType) {
        showError('consultationType', 'Vui lòng chọn nội dung cần tư vấn', formElement);
        isValid = false;
      }

      if (!name) {
        showError('name', 'Vui lòng nhập họ tên', formElement);
        isValid = false;
      }

      if (!phone) {
        showError('phone', 'Vui lòng nhập số điện thoại', formElement);
        isValid = false;
      } else if (!/^[0-9+\-\s()]+$/.test(phone)) {
        showError('phone', 'Số điện thoại chỉ được chứa số và các ký tự +, -, (), khoảng trắng', formElement);
        isValid = false;
      }

      if (email && !/\S+@\S+\.\S+/.test(email)) {
        showError('email', 'Email không hợp lệ', formElement);
        isValid = false;
      }

      return isValid;
    }

    function collectFormData(formElement) {
      const consultationType = formElement.querySelector('[name="consultationType"]:checked');
      const selectedType = consultationType ? consultationType.value : '';

      return {
        consultationType: selectedType,
        name: formElement.querySelector('[name="name"]').value.trim(),
        phone: formElement.querySelector('[name="phone"]').value.trim(),
        email: formElement.querySelector('[name="email"]').value.trim(),
        address: formElement.querySelector('[name="address"]').value.trim(),
        event: selectedType === 'dealer' ? 'partner' : 'tuvan',
        ctv: getUrlParam('ctv') || '',
        source_url: window.location.href,
      };
    }

    function getApiUrl(consultationType) {
      if (consultationType === 'dealer') {
        return 'https://workflow.realtimex.co/api/v1/executions/webhook/flowai/nagen_website_doitac/input';
      }

      return 'https://workflow.realtimex.co/api/v1/executions/webhook/flowai/nagen_website_datlich/input';
    }

    function setLoadingState(loading) {
      submitBtn.disabled = loading;
      submitText.style.display = loading ? 'none' : 'inline';
      submitLoading.style.display = loading ? 'flex' : 'none';

      const iconBtn = submitBtn.querySelector('.icon-button');
      if (iconBtn) {
        iconBtn.style.display = loading ? 'none' : 'flex';
      }
    }

    function showSuccess(submissionData) {
      const isDealer = submissionData.consultationType === 'dealer';
      const shouldShowEmail = !isDealer && submissionData.email;

      successProductMessage.style.display = isDealer ? 'none' : 'block';
      successDealerLine1.style.display = isDealer ? 'block' : 'none';
      successDealerLine2.style.display = isDealer ? 'block' : 'none';

      if (successEmailNote) {
        successEmailNote.style.display = shouldShowEmail ? 'block' : 'none';
      }

      if (successEmail) {
        successEmail.textContent = submissionData.email || '';
      }

      formFields.style.display = 'none';
      successMessage.style.display = 'block';
      successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function resetForm() {
      form.reset();
      clearAllErrors(form);
      formFields.style.display = 'flex';
      successMessage.style.display = 'none';
      applyDefaultConsultationType(form);

      const nameInput = form.querySelector('[name="name"]');
      if (nameInput) {
        nameInput.focus();
      }
    }

    function showError(fieldName, message, formElement) {
      const errorEl = formElement.querySelector('.cfb-form__error[data-field="' + fieldName + '"]');
      const inputEl = formElement.querySelector('[name="' + fieldName + '"]');

      if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('visible');
      }

      if (fieldName === 'consultationType' && optionsWrap) {
        optionsWrap.classList.add('error');
        return;
      }

      if (inputEl) {
        inputEl.classList.add('error');
      }
    }

    function clearError(fieldName, formElement) {
      const errorEl = formElement.querySelector('.cfb-form__error[data-field="' + fieldName + '"]');
      const inputEl = formElement.querySelector('[name="' + fieldName + '"]');

      if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.remove('visible');
      }

      if (fieldName === 'consultationType' && optionsWrap) {
        optionsWrap.classList.remove('error');
      }

      if (inputEl) {
        inputEl.classList.remove('error');
      }
    }

    function clearAllErrors(formElement) {
      formElement.querySelectorAll('.cfb-form__error').forEach(function(el) {
        el.textContent = '';
        el.classList.remove('visible');
      });

      formElement.querySelectorAll('.error').forEach(function(el) {
        el.classList.remove('error');
      });
    }
  }

  function applyDefaultConsultationType(form) {
    const selectedType = getDefaultConsultationType();
    if (!selectedType) {
      return;
    }

    const target = form.querySelector('[name="consultationType"][value="' + selectedType + '"]');
    if (target) {
      target.checked = true;
    }
  }

  function getDefaultConsultationType() {
    const consultationType = (getUrlParam('consultationType') || '').trim().toLowerCase();
    const type = (getUrlParam('type') || '').trim().toLowerCase();
    const candidate = consultationType || type;

    if (candidate === 'product' || candidate === 'dealer') {
      return candidate;
    }

    return '';
  }

  function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }
})();
