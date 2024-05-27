const validateSmen = (data) => {
  const { firstName, lastName, email, gender, phone } = data;
  const errors = [];

  const nameRegex = /^[а-яА-Яa-zA-Z]+(?:[-\s][а-яА-Яa-zA-Z]+)?$/u;

  // Проверка имени и фамилии
  if (firstName && !nameRegex.test(firstName)) {
    errors.push('Недопустимое имя');
  }

  if (lastName && !nameRegex.test(lastName)) {
    errors.push('Недопустимая фамилия');
  }

  // Проверка email
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Недопустимый email');
    }
  }

  // Проверка пола
  if (gender && gender !== 'Мужской' && gender !== 'Женский') {
    errors.push('Укажите корректный пол');
  }

  // Проверка номера телефона
  if (phone) {
    const phoneRegex = /^(\+7|8)?[-. ]?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{2}[-. ]?\d{2}$/;
    if (!phoneRegex.test(phone)) {
      errors.push('Недопустимый формат номера телефона');
    }
  }

  return { success: errors.length === 0, errors };
};

module.exports = { validateSmen };
