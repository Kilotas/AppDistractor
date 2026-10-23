import type { Lang } from "../i18n";

// Тексты /privacy и /terms живут отдельно от i18n/index.tsx: они длинные и
// меняются редко. При смене данных/провайдеров на бэкенде — обновить и здесь.

export type LegalKind = "privacy" | "terms";

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalDoc {
  title: string;
  updatedLabel: string;
  sections: LegalSection[];
}

export const LEGAL_UPDATED = "2026-10-24";

// Пока нет своего домена (этап 1) — связь через GitHub Issues.
// TODO(feat/custom-domain): заменить на support@<домен>.
export const CONTACT_URL = "https://github.com/Kilotas/AppDistractor/issues";

export const legalDocs: Record<LegalKind, Record<Lang, LegalDoc>> = {
  privacy: {
    ru: {
      title: "Политика конфиденциальности",
      updatedLabel: "Последнее обновление",
      sections: [
        {
          heading: "1. О сервисе",
          paragraphs: [
            "FocusVoid — веб-приложение и расширение для Chrome, которые помогают фокусироваться на задаче: вы задаёте белый список сайтов, а расширение блокирует остальные на время фокус-сессии. Эта политика описывает, какие данные мы собираем и как их используем.",
          ],
        },
        {
          heading: "2. Какие данные мы собираем",
          paragraphs: [
            "Аккаунт: email и пароль (хранится только в виде хэша). Гостевой аккаунт создаётся без вашего email.",
            "Данные, которые вы вводите: задачи и их описания, подзадачи, белые списки доменов, настройки рассылок (время и часовой пояс).",
            "Данные фокус-сессий: время начала и окончания, focus score, число попыток открыть заблокированный сайт, а также адрес (URL) и домен каждой заблокированной страницы с временем попытки.",
            "Технические данные: IP-адрес и сведения о запросе — для защиты от злоупотреблений (ограничение частоты запросов) и в отчётах об ошибках.",
          ],
        },
        {
          heading: "3. Расширение для Chrome",
          paragraphs: [
            "Расширение хранит локально (chrome.storage) токен входа, данные текущей сессии, белый список и настройки (язык, звук).",
            "Разрешения «tabs» и доступ ко всем сайтам нужны, чтобы блокировать сайты вне белого списка и распознать переход на страницу блокировки. Расширение не читает содержимое страниц, историю браузера, пароли или формы.",
            "На сервер отправляется только URL страницы, которую расширение заблокировало во время активной фокус-сессии. Вне сессии сведения о посещаемых сайтах не передаются.",
            "Использование данных, полученных расширением, соответствует Политике в отношении пользовательских данных Chrome Web Store, включая требования об ограниченном использовании (Limited Use).",
          ],
        },
        {
          heading: "4. Зачем мы используем данные",
          paragraphs: [
            "Чтобы предоставлять сервис: вход в аккаунт, блокировка сайтов, статистика и focus score, письма (подтверждение email, сброс пароля, рассылки, которые вы включили, — в недельной сводке есть список самых отвлекающих сайтов), AI-анализ задач, оплата подписки и исправление ошибок.",
            "Мы не продаём данные, не показываем рекламу и не используем данные для рекламного трекинга.",
          ],
        },
        {
          heading: "5. Кому передаются данные",
          paragraphs: [
            "Только сервисам, без которых FocusVoid не работает:",
            "• Railway — хостинг приложения и базы данных.",
            "• Яндекс (SMTP) и Resend — отправка писем; им передаются email и текст письма.",
            "• Anthropic (Claude API) — AI-анализ задачи по вашему запросу; передаются название и описание задачи, сводная статистика сессий и до пяти доменов, которые чаще всего блокировались (без полных адресов страниц и без email).",
            "• Lemon Squeezy — приём оплаты; платёжные данные вводятся у них, мы не видим номер карты.",
            "• Sentry — отчёты об ошибках; могут содержать IP-адрес и идентификатор аккаунта.",
          ],
        },
        {
          heading: "6. Хранение и удаление",
          paragraphs: [
            "Данные хранятся, пока существует ваш аккаунт. Чтобы удалить аккаунт и все связанные данные, напишите нам (раздел «Контакты») — мы удалим их в течение 30 дней.",
            "Локальные данные расширения удаляются вместе с расширением или при выходе из аккаунта в нём.",
          ],
        },
        {
          heading: "7. Ваши права",
          paragraphs: [
            "Вы можете запросить копию своих данных, их исправление или удаление, а также отозвать согласие на рассылки — в настройках или через контакты ниже.",
          ],
        },
        {
          heading: "8. Изменения политики",
          paragraphs: [
            "Мы можем обновлять политику; дата последнего обновления указана вверху. О существенных изменениях сообщим по email или в приложении.",
          ],
        },
        {
          heading: "9. Контакты",
          paragraphs: ["По вопросам о данных и для запросов на удаление:"],
        },
      ],
    },
    en: {
      title: "Privacy Policy",
      updatedLabel: "Last updated",
      sections: [
        {
          heading: "1. About the service",
          paragraphs: [
            "FocusVoid is a web app and a Chrome extension that help you focus on a task: you set a whitelist of sites, and the extension blocks everything else during a focus session. This policy explains what data we collect and how we use it.",
          ],
        },
        {
          heading: "2. Data we collect",
          paragraphs: [
            "Account: your email and password (stored only as a hash). Guest accounts are created without your email.",
            "Content you enter: tasks and their descriptions, subtasks, domain whitelists, email digest settings (time and time zone).",
            "Focus session data: start and end time, focus score, number of attempts to open a blocked site, and the URL and domain of each blocked page with the time of the attempt.",
            "Technical data: IP address and request details — for abuse protection (rate limiting) and in error reports.",
          ],
        },
        {
          heading: "3. Chrome extension",
          paragraphs: [
            "The extension stores locally (chrome.storage) your sign-in token, the current session, the whitelist and settings (language, sound).",
            "The \"tabs\" permission and access to all sites are needed to block sites outside your whitelist and to detect navigation to the block page. The extension does not read page content, browsing history, passwords or forms.",
            "Only the URL of a page the extension blocked during an active focus session is sent to our server. Outside a session, no information about the sites you visit is transmitted.",
            "The use of information received from the extension adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements.",
          ],
        },
        {
          heading: "4. How we use data",
          paragraphs: [
            "To provide the service: sign-in, site blocking, statistics and focus score, emails (email verification, password reset, digests you turned on — the weekly summary lists your most distracting sites), AI task analysis, subscription billing and fixing errors.",
            "We do not sell data, show ads, or use data for advertising tracking.",
          ],
        },
        {
          heading: "5. Who we share data with",
          paragraphs: [
            "Only with services FocusVoid cannot run without:",
            "• Railway — application and database hosting.",
            "• Yandex (SMTP) and Resend — email delivery; they receive your email address and the message.",
            "• Anthropic (Claude API) — AI task analysis on your request; it receives the task title and description, aggregated session statistics and up to five most frequently blocked domains (no full page addresses and no email).",
            "• Lemon Squeezy — payment processing; you enter payment details on their side, we never see your card number.",
            "• Sentry — error reports; these may include your IP address and account identifier.",
          ],
        },
        {
          heading: "6. Retention and deletion",
          paragraphs: [
            "We keep your data while your account exists. To delete your account and all related data, contact us (see \"Contact\") — we will delete it within 30 days.",
            "The extension's local data is removed when you uninstall the extension or sign out in it.",
          ],
        },
        {
          heading: "7. Your rights",
          paragraphs: [
            "You can request a copy of your data, its correction or deletion, and opt out of email digests — in the settings or via the contact below.",
          ],
        },
        {
          heading: "8. Changes to this policy",
          paragraphs: [
            "We may update this policy; the last update date is shown at the top. We will notify you of material changes by email or in the app.",
          ],
        },
        {
          heading: "9. Contact",
          paragraphs: ["For data questions and deletion requests:"],
        },
      ],
    },
  },
  terms: {
    ru: {
      title: "Условия использования",
      updatedLabel: "Последнее обновление",
      sections: [
        {
          heading: "1. Принятие условий",
          paragraphs: [
            "Используя FocusVoid (веб-приложение и расширение для Chrome), вы соглашаетесь с этими условиями и с Политикой конфиденциальности. Если вы не согласны — не используйте сервис.",
          ],
        },
        {
          heading: "2. Аккаунт",
          paragraphs: [
            "Вы отвечаете за сохранность пароля и за действия в своём аккаунте. Указывайте email, к которому у вас есть доступ. Гостевой аккаунт может быть ограничен по функциям.",
          ],
        },
        {
          heading: "3. Пробный период и подписка Pro",
          paragraphs: [
            "Новым аккаунтам доступен бесплатный пробный период 7 дней. После него часть функций требует подписки Pro.",
            "Оплату принимает Lemon Squeezy, который выступает продавцом (merchant of record) и обрабатывает налоги. Цена показывается перед оплатой. Подписка продлевается автоматически, пока вы её не отмените; отмена действует до конца оплаченного периода.",
            "Возвраты рассматриваются по запросу через контакты ниже и в соответствии с правилами Lemon Squeezy.",
          ],
        },
        {
          heading: "4. Допустимое использование",
          paragraphs: [
            "Запрещено: нарушать работу сервиса, обходить ограничения частоты запросов и проверки оплаты, получать доступ к чужим аккаунтам, использовать сервис для незаконной деятельности.",
          ],
        },
        {
          heading: "5. Блокировка сайтов и AI-анализ",
          paragraphs: [
            "Блокировка работает только в браузере с установленным и включённым расширением и может не сработать в отдельных случаях (другие браузеры, режим инкогнито, отключённое расширение).",
            "AI-инсайты генерируются автоматически и носят рекомендательный характер; они могут быть неточными.",
          ],
        },
        {
          heading: "6. Ваш контент",
          paragraphs: [
            "Задачи и другие введённые вами данные принадлежат вам. Вы даёте нам право обрабатывать их только для работы сервиса, как описано в Политике конфиденциальности.",
          ],
        },
        {
          heading: "7. Отказ от гарантий и ограничение ответственности",
          paragraphs: [
            "Сервис предоставляется «как есть», без гарантий бесперебойной работы. В пределах, допустимых законом, мы не отвечаем за косвенные убытки, упущенную выгоду или потерю данных; наша ответственность ограничена суммой, которую вы заплатили за последние 12 месяцев.",
          ],
        },
        {
          heading: "8. Прекращение",
          paragraphs: [
            "Вы можете перестать пользоваться сервисом и запросить удаление аккаунта в любой момент. Мы можем приостановить аккаунт при нарушении этих условий.",
          ],
        },
        {
          heading: "9. Изменения условий",
          paragraphs: [
            "Мы можем обновлять условия; дата последнего обновления указана вверху. Продолжая пользоваться сервисом после изменений, вы принимаете новые условия.",
          ],
        },
        {
          heading: "10. Контакты",
          paragraphs: ["Вопросы по условиям и оплате:"],
        },
      ],
    },
    en: {
      title: "Terms of Service",
      updatedLabel: "Last updated",
      sections: [
        {
          heading: "1. Acceptance",
          paragraphs: [
            "By using FocusVoid (the web app and the Chrome extension) you agree to these terms and to the Privacy Policy. If you do not agree, do not use the service.",
          ],
        },
        {
          heading: "2. Account",
          paragraphs: [
            "You are responsible for keeping your password safe and for activity in your account. Use an email address you have access to. Guest accounts may have limited features.",
          ],
        },
        {
          heading: "3. Trial and Pro subscription",
          paragraphs: [
            "New accounts get a free 7-day trial. After it ends, some features require a Pro subscription.",
            "Payments are processed by Lemon Squeezy, which acts as the merchant of record and handles taxes. The price is shown before checkout. The subscription renews automatically until you cancel; cancellation takes effect at the end of the paid period.",
            "Refunds are handled on request via the contact below and in line with Lemon Squeezy's policies.",
          ],
        },
        {
          heading: "4. Acceptable use",
          paragraphs: [
            "You may not disrupt the service, bypass rate limits or payment checks, access other people's accounts, or use the service for illegal activity.",
          ],
        },
        {
          heading: "5. Site blocking and AI analysis",
          paragraphs: [
            "Blocking works only in a browser with the extension installed and enabled, and may not apply in some cases (other browsers, incognito mode, a disabled extension).",
            "AI insights are generated automatically and are for guidance only; they may be inaccurate.",
          ],
        },
        {
          heading: "6. Your content",
          paragraphs: [
            "Tasks and other data you enter belong to you. You grant us the right to process them solely to operate the service, as described in the Privacy Policy.",
          ],
        },
        {
          heading: "7. Disclaimer and limitation of liability",
          paragraphs: [
            "The service is provided \"as is\", without a guarantee of uninterrupted operation. To the extent permitted by law, we are not liable for indirect damages, lost profits or data loss; our liability is limited to the amount you paid in the last 12 months.",
          ],
        },
        {
          heading: "8. Termination",
          paragraphs: [
            "You may stop using the service and request account deletion at any time. We may suspend accounts that violate these terms.",
          ],
        },
        {
          heading: "9. Changes to these terms",
          paragraphs: [
            "We may update these terms; the last update date is shown at the top. By continuing to use the service after changes, you accept the updated terms.",
          ],
        },
        {
          heading: "10. Contact",
          paragraphs: ["Questions about these terms or billing:"],
        },
      ],
    },
  },
};
