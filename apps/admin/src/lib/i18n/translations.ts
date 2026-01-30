// ===========================================
// Multi-language translations for Booking Portal
// ===========================================

export const SUPPORTED_LANGUAGES = ['en', 'de', 'uk', 'fr'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
export type SupportedLanguage = Language;

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  de: 'Deutsch',
  uk: 'Українська',
  fr: 'Français',
};

export const LANGUAGE_FLAGS: Record<Language, string> = {
  en: '🇬🇧',
  de: '🇩🇪',
  uk: '🇺🇦',
  fr: '🇫🇷',
};

export type TranslationKey = keyof typeof translations.en;

export const translations = {
  en: {
    // Header
    'nav.browseSpaces': 'Browse Spaces',
    'nav.signIn': 'Sign In',
    'nav.myBookings': 'My Bookings',
    'nav.signOut': 'Sign Out',

    // Hero
    'hero.title': 'Find Your Perfect Workspace',
    'hero.subtitle': 'Book private workspaces by the hour. Focus, create, succeed.',
    'hero.searchButton': 'Search Spaces',

    // Search
    'search.location': 'Location',
    'search.allLocations': 'All Locations',
    'search.date': 'Date',
    'search.search': 'Search',

    // Spaces
    'spaces.title': 'Available Spaces',
    'spaces.available': '{count} spaces available',
    'spaces.noSpaces': 'No spaces found',
    'spaces.noSpacesDesc': 'Try adjusting your filters or check back later.',
    'spaces.clearFilters': 'Clear all filters',
    'spaces.filters': 'Filters',
    'spaces.clear': 'Clear',
    'spaces.spaceType': 'Space Type',
    'spaces.allTypes': 'All Types',
    'spaces.minCapacity': 'Min Capacity',
    'spaces.any': 'Any',
    'spaces.person': 'person',
    'spaces.people': 'people',
    'spaces.maxPrice': 'Max Price/Hour',
    'spaces.upTo': 'Up to',
    'spaces.bookNow': 'Book now',
    'spaces.perHour': '/hour',

    // Space types
    'type.focus_pod': 'Focus Pod',
    'type.meeting_room': 'Meeting Room',
    'type.phone_booth': 'Phone Booth',
    'type.quiet_zone': 'Quiet Zone',

    // Space details
    'detail.capacity': 'Capacity',
    'detail.minBooking': 'Booking',
    'detail.minBookingValue': '1h min',
    'detail.pricePerHour': 'Per hour',
    'detail.confirmation': 'Confirmation',
    'detail.instant': 'Instant',
    'detail.amenities': 'Amenities',
    'detail.reviews': 'Reviews',

    // Booking form
    'booking.selectDate': 'Select Date',
    'booking.startTime': 'Start Time',
    'booking.duration': 'Duration',
    'booking.hour': 'hour',
    'booking.hours': 'hours',
    'booking.fullDay': 'Full day',
    'booking.yourDetails': 'Your details:',
    'booking.yourName': 'Your name',
    'booking.email': 'Email address',
    'booking.phone': 'Phone number',
    'booking.discount': 'Discount',
    'booking.off': 'off',
    'booking.total': 'Total',
    'booking.bookNow': 'Book Now',
    'booking.processing': 'Processing...',

    // Confirmation
    'confirm.title': 'Booking Confirmed!',
    'confirm.subtitle': 'Your workspace is reserved. Check your email for details.',
    'confirm.date': 'Date',
    'confirm.time': 'Time',
    'confirm.accessCode': 'Access Code',
    'confirm.accessCodeHint': 'Use this code to unlock the door when you arrive.',
    'confirm.totalPaid': 'Total Paid',
    'confirm.reference': 'Booking Reference',
    'confirm.viewDetails': 'View Booking Details',
    'confirm.bookAnother': 'Book Another Space',

    // Auth
    'auth.welcomeBack': 'Welcome back',
    'auth.signInSubtitle': 'Sign in to manage your bookings',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.signingIn': 'Signing in...',
    'auth.signIn': 'Sign In',
    'auth.noAccount': "Don't have an account?",
    'auth.createOne': 'Create one',
    'auth.bookAsGuest': 'book as a guest',
    'auth.withoutAccount': 'without creating an account.',
    'auth.alsoCanBook': 'You can also',

    // Register
    'register.title': 'Create an account',
    'register.subtitle': 'Start booking workspaces today',
    'register.fullName': 'Full Name',
    'register.phone': 'Phone',
    'register.optional': '(optional)',
    'register.confirmPassword': 'Confirm Password',
    'register.creating': 'Creating account...',
    'register.create': 'Create Account',
    'register.haveAccount': 'Already have an account?',
    'register.signIn': 'Sign in',

    // Password requirements
    'password.requirements': 'Password requirements',
    'password.minLength': 'At least 8 characters',
    'password.uppercase': 'One uppercase letter',
    'password.lowercase': 'One lowercase letter',
    'password.number': 'One number',
    'password.noMatch': 'Passwords do not match',

    // Locations
    'locations.title': 'Our Locations',
    'locations.spacesAvailable': '{count} spaces available',

    // Features section
    'features.title': 'Why Book With Us',
    'features.flexible.title': 'Flexible Hours',
    'features.flexible.desc': 'Book by the hour, day, or longer. Pay only for what you use.',
    'features.amenities.title': 'All Amenities Included',
    'features.amenities.desc': 'High-speed WiFi, power outlets, and comfortable seating.',
    'features.environment.title': 'Premium Environment',
    'features.environment.desc': 'Clean, quiet spaces designed for productivity.',

    // CTA
    'cta.title': 'Ready to Get Started?',
    'cta.subtitle': 'Find and book your perfect workspace in minutes.',
    'cta.button': 'Browse Available Spaces',

    // Footer
    'footer.poweredBy': 'Powered by',

    // Errors
    'error.notFound': 'Space Not Found',
    'error.notFoundDesc': "This space doesn't exist or is no longer available.",
    'error.browseSpaces': 'Browse available spaces',
    'error.workspaceNotFound': 'Workspace Not Found',
    'error.workspaceNotFoundDesc': "The booking portal you're looking for doesn't exist.",
    'error.invalidCredentials': 'Invalid email or password',
    'error.somethingWrong': 'Something went wrong. Please try again.',
    'error.registrationFailed': 'Registration failed',
    'error.bookingFailed': 'Failed to create booking',
    'error.slotNotAvailable': 'This time slot is not available',

    // My Bookings
    'myBookings.title': 'My Bookings',
    'myBookings.upcoming': 'Upcoming',
    'myBookings.past': 'Past',
    'myBookings.noUpcoming': 'No upcoming bookings',
    'myBookings.noUpcomingDesc': 'Book a workspace to get started.',
    'myBookings.noPast': 'No past bookings',
    'myBookings.noPastDesc': "You haven't completed any bookings yet.",
    'myBookings.browseSpaces': 'Browse Spaces',
    'myBookings.viewDetails': 'View Details',
    'myBookings.cancel': 'Cancel',

    // Status
    'status.pending': 'Pending',
    'status.confirmed': 'Confirmed',
    'status.active': 'Active',
    'status.completed': 'Completed',
    'status.cancelled': 'Cancelled',
  },

  de: {
    // Header
    'nav.browseSpaces': 'Räume durchsuchen',
    'nav.signIn': 'Anmelden',
    'nav.myBookings': 'Meine Buchungen',
    'nav.signOut': 'Abmelden',

    // Hero
    'hero.title': 'Finden Sie Ihren perfekten Arbeitsplatz',
    'hero.subtitle': 'Buchen Sie private Arbeitsräume stundenweise. Fokussieren, erschaffen, erfolgreich sein.',
    'hero.searchButton': 'Räume suchen',

    // Search
    'search.location': 'Standort',
    'search.allLocations': 'Alle Standorte',
    'search.date': 'Datum',
    'search.search': 'Suchen',

    // Spaces
    'spaces.title': 'Verfügbare Räume',
    'spaces.available': '{count} Räume verfügbar',
    'spaces.noSpaces': 'Keine Räume gefunden',
    'spaces.noSpacesDesc': 'Versuchen Sie, Ihre Filter anzupassen oder schauen Sie später wieder vorbei.',
    'spaces.clearFilters': 'Alle Filter löschen',
    'spaces.filters': 'Filter',
    'spaces.clear': 'Löschen',
    'spaces.spaceType': 'Raumtyp',
    'spaces.allTypes': 'Alle Typen',
    'spaces.minCapacity': 'Min. Kapazität',
    'spaces.any': 'Beliebig',
    'spaces.person': 'Person',
    'spaces.people': 'Personen',
    'spaces.maxPrice': 'Max. Preis/Stunde',
    'spaces.upTo': 'Bis zu',
    'spaces.bookNow': 'Jetzt buchen',
    'spaces.perHour': '/Stunde',

    // Space types
    'type.focus_pod': 'Fokus-Pod',
    'type.meeting_room': 'Besprechungsraum',
    'type.phone_booth': 'Telefonkabine',
    'type.quiet_zone': 'Ruhezone',

    // Space details
    'detail.capacity': 'Kapazität',
    'detail.minBooking': 'Buchung',
    'detail.minBookingValue': 'Min. 1 Std.',
    'detail.pricePerHour': 'Pro Stunde',
    'detail.confirmation': 'Bestätigung',
    'detail.instant': 'Sofort',
    'detail.amenities': 'Ausstattung',
    'detail.reviews': 'Bewertungen',

    // Booking form
    'booking.selectDate': 'Datum wählen',
    'booking.startTime': 'Startzeit',
    'booking.duration': 'Dauer',
    'booking.hour': 'Stunde',
    'booking.hours': 'Stunden',
    'booking.fullDay': 'Ganzer Tag',
    'booking.yourDetails': 'Ihre Daten:',
    'booking.yourName': 'Ihr Name',
    'booking.email': 'E-Mail-Adresse',
    'booking.phone': 'Telefonnummer',
    'booking.discount': 'Rabatt',
    'booking.off': 'Rabatt',
    'booking.total': 'Gesamt',
    'booking.bookNow': 'Jetzt buchen',
    'booking.processing': 'Wird verarbeitet...',

    // Confirmation
    'confirm.title': 'Buchung bestätigt!',
    'confirm.subtitle': 'Ihr Arbeitsplatz ist reserviert. Überprüfen Sie Ihre E-Mail für Details.',
    'confirm.date': 'Datum',
    'confirm.time': 'Zeit',
    'confirm.accessCode': 'Zugangscode',
    'confirm.accessCodeHint': 'Verwenden Sie diesen Code, um die Tür bei Ihrer Ankunft zu öffnen.',
    'confirm.totalPaid': 'Gesamtbetrag',
    'confirm.reference': 'Buchungsreferenz',
    'confirm.viewDetails': 'Buchungsdetails anzeigen',
    'confirm.bookAnother': 'Weiteren Raum buchen',

    // Auth
    'auth.welcomeBack': 'Willkommen zurück',
    'auth.signInSubtitle': 'Melden Sie sich an, um Ihre Buchungen zu verwalten',
    'auth.email': 'E-Mail',
    'auth.password': 'Passwort',
    'auth.signingIn': 'Anmeldung...',
    'auth.signIn': 'Anmelden',
    'auth.noAccount': 'Noch kein Konto?',
    'auth.createOne': 'Erstellen Sie eines',
    'auth.bookAsGuest': 'als Gast buchen',
    'auth.withoutAccount': 'ohne ein Konto zu erstellen.',
    'auth.alsoCanBook': 'Sie können auch',

    // Register
    'register.title': 'Konto erstellen',
    'register.subtitle': 'Beginnen Sie noch heute mit der Buchung von Arbeitsräumen',
    'register.fullName': 'Vollständiger Name',
    'register.phone': 'Telefon',
    'register.optional': '(optional)',
    'register.confirmPassword': 'Passwort bestätigen',
    'register.creating': 'Konto wird erstellt...',
    'register.create': 'Konto erstellen',
    'register.haveAccount': 'Haben Sie bereits ein Konto?',
    'register.signIn': 'Anmelden',

    // Password requirements
    'password.requirements': 'Passwortanforderungen',
    'password.minLength': 'Mindestens 8 Zeichen',
    'password.uppercase': 'Ein Großbuchstabe',
    'password.lowercase': 'Ein Kleinbuchstabe',
    'password.number': 'Eine Zahl',
    'password.noMatch': 'Passwörter stimmen nicht überein',

    // Locations
    'locations.title': 'Unsere Standorte',
    'locations.spacesAvailable': '{count} Räume verfügbar',

    // Features section
    'features.title': 'Warum bei uns buchen',
    'features.flexible.title': 'Flexible Zeiten',
    'features.flexible.desc': 'Buchen Sie stundenweise, tageweise oder länger. Zahlen Sie nur für das, was Sie nutzen.',
    'features.amenities.title': 'Alle Annehmlichkeiten inklusive',
    'features.amenities.desc': 'Schnelles WLAN, Steckdosen und bequeme Sitzgelegenheiten.',
    'features.environment.title': 'Premium-Umgebung',
    'features.environment.desc': 'Saubere, ruhige Räume für Produktivität.',

    // CTA
    'cta.title': 'Bereit loszulegen?',
    'cta.subtitle': 'Finden und buchen Sie Ihren perfekten Arbeitsplatz in wenigen Minuten.',
    'cta.button': 'Verfügbare Räume durchsuchen',

    // Footer
    'footer.poweredBy': 'Bereitgestellt von',

    // Errors
    'error.notFound': 'Raum nicht gefunden',
    'error.notFoundDesc': 'Dieser Raum existiert nicht oder ist nicht mehr verfügbar.',
    'error.browseSpaces': 'Verfügbare Räume durchsuchen',
    'error.workspaceNotFound': 'Arbeitsplatz nicht gefunden',
    'error.workspaceNotFoundDesc': 'Das gesuchte Buchungsportal existiert nicht.',
    'error.invalidCredentials': 'Ungültige E-Mail oder Passwort',
    'error.somethingWrong': 'Etwas ist schief gelaufen. Bitte versuchen Sie es erneut.',
    'error.registrationFailed': 'Registrierung fehlgeschlagen',
    'error.bookingFailed': 'Buchung konnte nicht erstellt werden',
    'error.slotNotAvailable': 'Dieses Zeitfenster ist nicht verfügbar',

    // My Bookings
    'myBookings.title': 'Meine Buchungen',
    'myBookings.upcoming': 'Kommende',
    'myBookings.past': 'Vergangene',
    'myBookings.noUpcoming': 'Keine kommenden Buchungen',
    'myBookings.noUpcomingDesc': 'Buchen Sie einen Arbeitsplatz, um zu beginnen.',
    'myBookings.noPast': 'Keine vergangenen Buchungen',
    'myBookings.noPastDesc': 'Sie haben noch keine Buchungen abgeschlossen.',
    'myBookings.browseSpaces': 'Räume durchsuchen',
    'myBookings.viewDetails': 'Details anzeigen',
    'myBookings.cancel': 'Stornieren',

    // Status
    'status.pending': 'Ausstehend',
    'status.confirmed': 'Bestätigt',
    'status.active': 'Aktiv',
    'status.completed': 'Abgeschlossen',
    'status.cancelled': 'Storniert',
  },

  uk: {
    // Header
    'nav.browseSpaces': 'Переглянути простори',
    'nav.signIn': 'Увійти',
    'nav.myBookings': 'Мої бронювання',
    'nav.signOut': 'Вийти',

    // Hero
    'hero.title': 'Знайдіть ідеальний робочий простір',
    'hero.subtitle': 'Бронюйте приватні робочі місця погодинно. Фокусуйтесь, створюйте, досягайте успіху.',
    'hero.searchButton': 'Шукати простори',

    // Search
    'search.location': 'Локація',
    'search.allLocations': 'Всі локації',
    'search.date': 'Дата',
    'search.search': 'Пошук',

    // Spaces
    'spaces.title': 'Доступні простори',
    'spaces.available': '{count} просторів доступно',
    'spaces.noSpaces': 'Просторів не знайдено',
    'spaces.noSpacesDesc': 'Спробуйте змінити фільтри або поверніться пізніше.',
    'spaces.clearFilters': 'Очистити всі фільтри',
    'spaces.filters': 'Фільтри',
    'spaces.clear': 'Очистити',
    'spaces.spaceType': 'Тип простору',
    'spaces.allTypes': 'Всі типи',
    'spaces.minCapacity': 'Мін. місткість',
    'spaces.any': 'Будь-яка',
    'spaces.person': 'особа',
    'spaces.people': 'осіб',
    'spaces.maxPrice': 'Макс. ціна/година',
    'spaces.upTo': 'До',
    'spaces.bookNow': 'Забронювати',
    'spaces.perHour': '/година',

    // Space types
    'type.focus_pod': 'Фокус-под',
    'type.meeting_room': 'Переговорна',
    'type.phone_booth': 'Телефонна кабіна',
    'type.quiet_zone': 'Тиха зона',

    // Space details
    'detail.capacity': 'Місткість',
    'detail.minBooking': 'Бронювання',
    'detail.minBookingValue': 'Мін. 1 год.',
    'detail.pricePerHour': 'За годину',
    'detail.confirmation': 'Підтвердження',
    'detail.instant': 'Миттєве',
    'detail.amenities': 'Зручності',
    'detail.reviews': 'Відгуки',

    // Booking form
    'booking.selectDate': 'Оберіть дату',
    'booking.startTime': 'Час початку',
    'booking.duration': 'Тривалість',
    'booking.hour': 'година',
    'booking.hours': 'годин',
    'booking.fullDay': 'Повний день',
    'booking.yourDetails': 'Ваші дані:',
    'booking.yourName': 'Ваше ім\'я',
    'booking.email': 'Email адреса',
    'booking.phone': 'Номер телефону',
    'booking.discount': 'Знижка',
    'booking.off': 'знижка',
    'booking.total': 'Всього',
    'booking.bookNow': 'Забронювати',
    'booking.processing': 'Обробка...',

    // Confirmation
    'confirm.title': 'Бронювання підтверджено!',
    'confirm.subtitle': 'Ваш робочий простір заброньовано. Перевірте email для деталей.',
    'confirm.date': 'Дата',
    'confirm.time': 'Час',
    'confirm.accessCode': 'Код доступу',
    'confirm.accessCodeHint': 'Використовуйте цей код, щоб відкрити двері по прибутті.',
    'confirm.totalPaid': 'Сплачено',
    'confirm.reference': 'Номер бронювання',
    'confirm.viewDetails': 'Переглянути деталі',
    'confirm.bookAnother': 'Забронювати інший простір',

    // Auth
    'auth.welcomeBack': 'З поверненням',
    'auth.signInSubtitle': 'Увійдіть, щоб керувати своїми бронюваннями',
    'auth.email': 'Email',
    'auth.password': 'Пароль',
    'auth.signingIn': 'Вхід...',
    'auth.signIn': 'Увійти',
    'auth.noAccount': 'Немає облікового запису?',
    'auth.createOne': 'Створити',
    'auth.bookAsGuest': 'забронювати як гість',
    'auth.withoutAccount': 'без створення облікового запису.',
    'auth.alsoCanBook': 'Ви також можете',

    // Register
    'register.title': 'Створити обліковий запис',
    'register.subtitle': 'Почніть бронювати робочі простори вже сьогодні',
    'register.fullName': 'Повне ім\'я',
    'register.phone': 'Телефон',
    'register.optional': '(необов\'язково)',
    'register.confirmPassword': 'Підтвердити пароль',
    'register.creating': 'Створення облікового запису...',
    'register.create': 'Створити обліковий запис',
    'register.haveAccount': 'Вже є обліковий запис?',
    'register.signIn': 'Увійти',

    // Password requirements
    'password.requirements': 'Вимоги до пароля',
    'password.minLength': 'Мінімум 8 символів',
    'password.uppercase': 'Одна велика літера',
    'password.lowercase': 'Одна мала літера',
    'password.number': 'Одна цифра',
    'password.noMatch': 'Паролі не збігаються',

    // Locations
    'locations.title': 'Наші локації',
    'locations.spacesAvailable': '{count} просторів доступно',

    // Features section
    'features.title': 'Чому варто бронювати у нас',
    'features.flexible.title': 'Гнучкий графік',
    'features.flexible.desc': 'Бронюйте погодинно, на день або довше. Платіть лише за те, що використовуєте.',
    'features.amenities.title': 'Всі зручності включені',
    'features.amenities.desc': 'Швидкий WiFi, розетки та зручні сидіння.',
    'features.environment.title': 'Преміум середовище',
    'features.environment.desc': 'Чисті, тихі простори для продуктивності.',

    // CTA
    'cta.title': 'Готові почати?',
    'cta.subtitle': 'Знайдіть і забронюйте ідеальний робочий простір за кілька хвилин.',
    'cta.button': 'Переглянути доступні простори',

    // Footer
    'footer.poweredBy': 'Працює на',

    // Errors
    'error.notFound': 'Простір не знайдено',
    'error.notFoundDesc': 'Цей простір не існує або більше не доступний.',
    'error.browseSpaces': 'Переглянути доступні простори',
    'error.workspaceNotFound': 'Робочий простір не знайдено',
    'error.workspaceNotFoundDesc': 'Портал бронювання, який ви шукаєте, не існує.',
    'error.invalidCredentials': 'Невірний email або пароль',
    'error.somethingWrong': 'Щось пішло не так. Спробуйте ще раз.',
    'error.registrationFailed': 'Помилка реєстрації',
    'error.bookingFailed': 'Не вдалося створити бронювання',
    'error.slotNotAvailable': 'Цей час недоступний',

    // My Bookings
    'myBookings.title': 'Мої бронювання',
    'myBookings.upcoming': 'Майбутні',
    'myBookings.past': 'Минулі',
    'myBookings.noUpcoming': 'Немає майбутніх бронювань',
    'myBookings.noUpcomingDesc': 'Забронюйте робочий простір, щоб почати.',
    'myBookings.noPast': 'Немає минулих бронювань',
    'myBookings.noPastDesc': 'Ви ще не завершили жодного бронювання.',
    'myBookings.browseSpaces': 'Переглянути простори',
    'myBookings.viewDetails': 'Деталі',
    'myBookings.cancel': 'Скасувати',

    // Status
    'status.pending': 'Очікує',
    'status.confirmed': 'Підтверджено',
    'status.active': 'Активне',
    'status.completed': 'Завершено',
    'status.cancelled': 'Скасовано',
  },

  fr: {
    // Header
    'nav.browseSpaces': 'Parcourir les espaces',
    'nav.signIn': 'Se connecter',
    'nav.myBookings': 'Mes réservations',
    'nav.signOut': 'Se déconnecter',

    // Hero
    'hero.title': 'Trouvez votre espace de travail idéal',
    'hero.subtitle': 'Réservez des espaces de travail privés à l\'heure. Concentrez-vous, créez, réussissez.',
    'hero.searchButton': 'Rechercher des espaces',

    // Search
    'search.location': 'Emplacement',
    'search.allLocations': 'Tous les emplacements',
    'search.date': 'Date',
    'search.search': 'Rechercher',

    // Spaces
    'spaces.title': 'Espaces disponibles',
    'spaces.available': '{count} espaces disponibles',
    'spaces.noSpaces': 'Aucun espace trouvé',
    'spaces.noSpacesDesc': 'Essayez d\'ajuster vos filtres ou revenez plus tard.',
    'spaces.clearFilters': 'Effacer tous les filtres',
    'spaces.filters': 'Filtres',
    'spaces.clear': 'Effacer',
    'spaces.spaceType': 'Type d\'espace',
    'spaces.allTypes': 'Tous les types',
    'spaces.minCapacity': 'Capacité min.',
    'spaces.any': 'Tous',
    'spaces.person': 'personne',
    'spaces.people': 'personnes',
    'spaces.maxPrice': 'Prix max./heure',
    'spaces.upTo': 'Jusqu\'à',
    'spaces.bookNow': 'Réserver',
    'spaces.perHour': '/heure',

    // Space types
    'type.focus_pod': 'Pod de concentration',
    'type.meeting_room': 'Salle de réunion',
    'type.phone_booth': 'Cabine téléphonique',
    'type.quiet_zone': 'Zone calme',

    // Space details
    'detail.capacity': 'Capacité',
    'detail.minBooking': 'Réservation',
    'detail.minBookingValue': '1h min.',
    'detail.pricePerHour': 'Par heure',
    'detail.confirmation': 'Confirmation',
    'detail.instant': 'Instantanée',
    'detail.amenities': 'Équipements',
    'detail.reviews': 'Avis',

    // Booking form
    'booking.selectDate': 'Sélectionner une date',
    'booking.startTime': 'Heure de début',
    'booking.duration': 'Durée',
    'booking.hour': 'heure',
    'booking.hours': 'heures',
    'booking.fullDay': 'Journée complète',
    'booking.yourDetails': 'Vos coordonnées :',
    'booking.yourName': 'Votre nom',
    'booking.email': 'Adresse e-mail',
    'booking.phone': 'Numéro de téléphone',
    'booking.discount': 'Réduction',
    'booking.off': 'de réduction',
    'booking.total': 'Total',
    'booking.bookNow': 'Réserver maintenant',
    'booking.processing': 'Traitement...',

    // Confirmation
    'confirm.title': 'Réservation confirmée !',
    'confirm.subtitle': 'Votre espace de travail est réservé. Consultez votre e-mail pour les détails.',
    'confirm.date': 'Date',
    'confirm.time': 'Heure',
    'confirm.accessCode': 'Code d\'accès',
    'confirm.accessCodeHint': 'Utilisez ce code pour déverrouiller la porte à votre arrivée.',
    'confirm.totalPaid': 'Total payé',
    'confirm.reference': 'Référence de réservation',
    'confirm.viewDetails': 'Voir les détails',
    'confirm.bookAnother': 'Réserver un autre espace',

    // Auth
    'auth.welcomeBack': 'Bon retour',
    'auth.signInSubtitle': 'Connectez-vous pour gérer vos réservations',
    'auth.email': 'E-mail',
    'auth.password': 'Mot de passe',
    'auth.signingIn': 'Connexion...',
    'auth.signIn': 'Se connecter',
    'auth.noAccount': 'Pas de compte ?',
    'auth.createOne': 'Créez-en un',
    'auth.bookAsGuest': 'réserver en tant qu\'invité',
    'auth.withoutAccount': 'sans créer de compte.',
    'auth.alsoCanBook': 'Vous pouvez également',

    // Register
    'register.title': 'Créer un compte',
    'register.subtitle': 'Commencez à réserver des espaces de travail dès aujourd\'hui',
    'register.fullName': 'Nom complet',
    'register.phone': 'Téléphone',
    'register.optional': '(facultatif)',
    'register.confirmPassword': 'Confirmer le mot de passe',
    'register.creating': 'Création du compte...',
    'register.create': 'Créer un compte',
    'register.haveAccount': 'Vous avez déjà un compte ?',
    'register.signIn': 'Se connecter',

    // Password requirements
    'password.requirements': 'Exigences du mot de passe',
    'password.minLength': 'Au moins 8 caractères',
    'password.uppercase': 'Une lettre majuscule',
    'password.lowercase': 'Une lettre minuscule',
    'password.number': 'Un chiffre',
    'password.noMatch': 'Les mots de passe ne correspondent pas',

    // Locations
    'locations.title': 'Nos emplacements',
    'locations.spacesAvailable': '{count} espaces disponibles',

    // Features section
    'features.title': 'Pourquoi réserver chez nous',
    'features.flexible.title': 'Horaires flexibles',
    'features.flexible.desc': 'Réservez à l\'heure, à la journée ou plus. Payez uniquement ce que vous utilisez.',
    'features.amenities.title': 'Tous les équipements inclus',
    'features.amenities.desc': 'WiFi haut débit, prises électriques et sièges confortables.',
    'features.environment.title': 'Environnement premium',
    'features.environment.desc': 'Espaces propres et calmes conçus pour la productivité.',

    // CTA
    'cta.title': 'Prêt à commencer ?',
    'cta.subtitle': 'Trouvez et réservez votre espace de travail idéal en quelques minutes.',
    'cta.button': 'Parcourir les espaces disponibles',

    // Footer
    'footer.poweredBy': 'Propulsé par',

    // Errors
    'error.notFound': 'Espace non trouvé',
    'error.notFoundDesc': 'Cet espace n\'existe pas ou n\'est plus disponible.',
    'error.browseSpaces': 'Parcourir les espaces disponibles',
    'error.workspaceNotFound': 'Espace de travail non trouvé',
    'error.workspaceNotFoundDesc': 'Le portail de réservation que vous recherchez n\'existe pas.',
    'error.invalidCredentials': 'E-mail ou mot de passe invalide',
    'error.somethingWrong': 'Une erreur s\'est produite. Veuillez réessayer.',
    'error.registrationFailed': 'Échec de l\'inscription',
    'error.bookingFailed': 'Échec de la création de la réservation',
    'error.slotNotAvailable': 'Ce créneau horaire n\'est pas disponible',

    // My Bookings
    'myBookings.title': 'Mes réservations',
    'myBookings.upcoming': 'À venir',
    'myBookings.past': 'Passées',
    'myBookings.noUpcoming': 'Aucune réservation à venir',
    'myBookings.noUpcomingDesc': 'Réservez un espace de travail pour commencer.',
    'myBookings.noPast': 'Aucune réservation passée',
    'myBookings.noPastDesc': 'Vous n\'avez pas encore effectué de réservation.',
    'myBookings.browseSpaces': 'Parcourir les espaces',
    'myBookings.viewDetails': 'Voir les détails',
    'myBookings.cancel': 'Annuler',

    // Status
    'status.pending': 'En attente',
    'status.confirmed': 'Confirmé',
    'status.active': 'Actif',
    'status.completed': 'Terminé',
    'status.cancelled': 'Annulé',
  },
} as const;

// Helper to get translation with fallback
export function getTranslation(lang: Language, key: TranslationKey, params?: Record<string, string | number>): string {
  let text: string = translations[lang]?.[key] || translations.en[key] || key;

  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      text = text.replace(`{${param}}`, String(value));
    });
  }

  return text;
}

// Detect browser language
export function detectBrowserLanguage(): Language {
  if (typeof navigator === 'undefined') return 'en';

  const browserLang = navigator.language.split('-')[0].toLowerCase();

  if (SUPPORTED_LANGUAGES.includes(browserLang as Language)) {
    return browserLang as Language;
  }

  return 'en';
}
