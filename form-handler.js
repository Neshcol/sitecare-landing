// SiteCare — обработчик форм заявок
// Схема: форма → Telegram Bot API → сообщение админу
// Никакого backend не нужно

const TELEGRAM_BOT_TOKEN = '8936243340:AAGvjYAVhxdsv921ZL-veKYvjzRHRXBGeqc';
const ADMIN_CHAT_ID = '1284660534';

// Отправка в Telegram
async function sendToTelegram(data) {
  const text = `
🆕 *Новая заявка SiteCare*

🌐 *Сайт:* ${escapeMarkdown(data.site)}
📋 *Задача:* ${escapeMarkdown(data.task)}
📞 *Контакт:* ${escapeMarkdown(data.contact)}
🏷 *Тариф:* ${escapeMarkdown(data.tariff)}
🎫 *Тикет:* ${data.ticketId}
🕐 *Время:* ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })} МСК

#заявка #sitecare
  `.trim();

  const res = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text,
        parse_mode: 'Markdown'
      })
    }
  );

  if (!res.ok) throw new Error('Telegram API: ' + res.status);
  return res.json();
}

// Экранирование спецсимволов Markdown
function escapeMarkdown(str) {
  return String(str || '—').replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

// Генерация ID тикета: N + 3 последних цифры timestamp
function generateTicketId() {
  return 'N' + String(Date.now()).slice(-3);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  // Все формы с классом .sitecare-form
  document.querySelectorAll('.sitecare-form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      handleSubmit(form);
    });
  });

  // Кнопки тарифов открывают модалку с нужным заголовком
  document.querySelectorAll('[data-open-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tariff = btn.dataset.tariff || '';
      const modal = document.getElementById('order-modal');
      if (tariff) {
        modal.querySelector('#modal-title').textContent = 'Заявка — тариф ' + tariff;
        modal.querySelector('[name="tariff"]').value = tariff;
      }
      modal.showModal();
    });
  });

  // Закрытие модалки по клику вне её
  const modal = document.getElementById('order-modal');
  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.close();
    });
  }
});

// Обработка отправки формы
async function handleSubmit(form) {
  const btn = form.querySelector('button[type="submit"]');
  const section = form.closest('.form-wrapper') || form.parentElement;
  const successBlock = section.querySelector('.form-success');

  const data = {
    site:    (form.querySelector('[name="site"]')?.value || '').trim(),
    task:    (form.querySelector('[name="task"]')?.value || 'Бесплатный аудит').trim(),
    contact: (form.querySelector('[name="contact"]')?.value || '').trim(),
    tariff:  (form.querySelector('[name="tariff"]')?.value || 'Не указан').trim(),
    ticketId: generateTicketId()
  };

  // Простая валидация сайта
  if (!data.site) {
    showError(form, 'Укажите адрес вашего сайта');
    return;
  }

  // Блокируем кнопку
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Отправляем...';

  try {
    await sendToTelegram(data);

    // Показываем успех
    form.style.display = 'none';
    if (successBlock) {
      successBlock.innerHTML = `
        <div class="success-inner">
          <div class="success-icon">✓</div>
          <h3>Принято — тикет ${data.ticketId}</h3>
          <p>Напишем в течение 1 часа в рабочее время<br>10:00–20:00 МСК · <a href="https://t.me/Neshcol">@Neshcol</a></p>
        </div>
      `;
      successBlock.style.display = 'flex';
    }

  } catch (err) {
    btn.disabled = false;
    btn.textContent = originalText;
    showError(form, 'Ошибка отправки. Напишите напрямую: @Neshcol');
    console.error('[SiteCare form]', err);
  }
}

// Показ ошибки под формой
function showError(form, message) {
  let el = form.querySelector('.form-error');
  if (!el) {
    el = document.createElement('p');
    el.className = 'form-error';
    form.appendChild(el);
  }
  el.textContent = message;
}
