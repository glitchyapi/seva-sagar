/* ══════════════════════════════════════════════════════════════
   Seva Sagar · i18n — हिन्दी · English · ਪੰਜਾਬੀ · हरियाणवी
   Fallback chain: chosen lang -> hi -> key
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var S = window.Seva;

  var hi = {
    'app.name': 'सेवा सागर',
    'app.tag': 'संत रामपाल जी महाराज · भक्त सेवा डायरी',
    'nav.home': 'होम', 'nav.seva': 'सेवा', 'nav.bhandara': 'भंडारा', 'nav.profile': 'प्रोफ़ाइल',
    'greet.line': 'राम सत नाम', 'greet.morning': 'सुप्रभात', 'greet.afternoon': 'नमस्कार',
    'greet.evening': 'शुभ संध्या', 'greet.night': 'शुभ रात्रि', 'greet.friend': 'भक्त',
    'home.today': 'आज की साधना', 'home.target': 'लक्ष्य', 'home.completed': 'पूर्ण',
    'home.streak': 'लगातार', 'home.days': 'दिन', 'home.addSeva': 'सेवा जोड़ें',
    'home.quick': 'तुरंत सेवा', 'home.todayList': 'आज का लेखा', 'home.viewAll': 'सभी देखें',
    'home.empty': 'आज अभी कोई सेवा दर्ज नहीं', 'home.emptySub': 'नीचे + दबाकर अपनी पहली सेवा जोड़ें',
    'home.week': 'इस सप्ताह', 'home.thought': 'आज का सुविचार', 'home.remaining': 'शेष',
    'home.done': 'आज का लक्ष्य पूरा! बहुत उत्तम 🙏',
    'seva.title': 'सेवा डायरी', 'seva.all': 'सभी', 'seva.add': 'सेवा दर्ज करें',
    'seva.edit': 'सेवा बदलें', 'seva.count': 'मात्रा', 'seva.note': 'टिप्पणी',
    'seva.notePh': 'आज की अनुभूति…', 'seva.place': 'स्थान', 'seva.placePh': 'आश्रम / घर / सत्संग स्थल',
    'seva.date': 'दिनांक', 'seva.type': 'सेवा का प्रकार', 'seva.empty': 'कोई सेवा नहीं मिली',
    'seva.emptySub': 'इस महीने की सेवाएँ यहाँ दिखेंगी', 'seva.calendar': 'सेवा कैलेंडर',
    'seva.monthTotal': 'इस माह', 'seva.deleteAsk': 'यह सेवा हटाएँ?',
    'seva.deleteMsg': 'यह प्रविष्टि हमेशा के लिए हट जाएगी।', 'seva.entries': 'प्रविष्टियाँ',
    'type.naam': 'नाम जप', 'type.satsang': 'सत्संग', 'type.path': 'पाठ',
    'type.bhandara': 'भंडारा सेवा', 'type.prachar': 'प्रचार सेवा', 'type.daan': 'दान',
    'unit.mala': 'माला', 'unit.minute': 'मिनट', 'unit.page': 'पृष्ठ', 'unit.hour': 'घंटे', 'unit.count': 'संख्या',
    'bhandara.title': 'भंडारा', 'bhandara.make': 'बैनर बनाएँ', 'bhandara.mine': 'मेरे भंडारे',
    'bhandara.template': 'डिज़ाइन चुनें', 'bhandara.eventName': 'कार्यक्रम का नाम',
    'bhandara.date': 'दिनांक', 'bhandara.time': 'समय', 'bhandara.venue': 'स्थान',
    'bhandara.venuePh': 'आश्रम / गाँव / शहर', 'bhandara.organizer': 'आयोजक',
    'bhandara.organizerPh': 'आपका नाम / समिति', 'bhandara.phone': 'संपर्क नंबर',
    'bhandara.message': 'संदेश', 'bhandara.preview': 'झलक', 'bhandara.share': 'शेयर करें',
    'bhandara.saveImg': 'गैलरी में सेव', 'bhandara.saveEvent': 'भंडारा सेव करें',
    'bhandara.empty': 'अभी कोई भंडारा सेव नहीं', 'bhandara.emptySub': 'बैनर बनाकर भंडारा सेव करें, रिमाइंडर अपने आप लगेगा',
    'bhandara.remind': 'रिमाइंडर', 'bhandara.upcoming': 'आगामी', 'bhandara.past': 'संपन्न',
    'bhandara.daysLeft': 'दिन शेष', 'bhandara.todayIs': 'आज है!', 'bhandara.defaultTitle': 'विशाल भंडारा',
    'bhandara.invite': 'सपरिवार पधारें', 'bhandara.blessings': 'संत रामपाल जी महाराज की कृपा से',
    'bhandara.free': 'निःशुल्क सत्संग एवं भंडारा', 'bhandara.allWelcome': 'सभी साधकों का हार्दिक स्वागत',
    'profile.title': 'प्रोफ़ाइल', 'profile.edit': 'प्रोफ़ाइल बदलें', 'profile.name': 'नाम',
    'profile.namePh': 'आपका नाम', 'profile.city': 'गाँव / शहर', 'profile.initiated': 'नाम दीक्षा दिवस',
    'profile.stats': 'सेवा आँकड़े', 'profile.settings': 'सेटिंग्स', 'profile.language': 'भाषा',
    'profile.theme': 'थीम', 'profile.accent': 'रंग', 'profile.reminders': 'सेवा रिमाइंडर',
    'profile.remindersSub': 'रोज़ तय समय पर याद दिलाएँ', 'profile.notifications': 'नोटिफिकेशन',
    'profile.data': 'डेटा और सुरक्षा', 'profile.update': 'ऐप अपडेट', 'profile.permissions': 'अनुमतियाँ',
    'profile.about': 'ऐप के बारे में', 'profile.totalSeva': 'कुल सेवाएँ', 'profile.best': 'सर्वश्रेष्ठ लगातार',
    'profile.active': 'सक्रिय दिन', 'profile.malas': 'कुल माला', 'profile.member': 'साधक sejak',
    'theme.system': 'सिस्टम', 'theme.light': 'उजला', 'theme.dark': 'गहरा', 'theme.amoled': 'अमोलेड',
    'lang.hi': 'हिन्दी', 'lang.en': 'English', 'lang.pa': 'ਪੰਜਾਬੀ', 'lang.hr': 'हरियाणवी',
    'data.enc': 'एन्क्रिप्शन', 'data.comp': 'कम्प्रेशन', 'data.savedSpace': 'बचत',
    'data.pin': 'पिन लॉक', 'data.pinSub': 'डायरी खोलने के लिए पिन', 'data.pinSet': 'पिन लगाएँ',
    'data.pinRemove': 'पिन हटाएँ', 'data.pinEnter': 'पिन डालें', 'data.pinWrong': 'गलत पिन',
    'data.pinNew': 'नया पिन (कम से कम 4 अंक)', 'data.backup': 'बैकअप बनाएँ',
    'data.backupSub': 'एन्क्रिप्टेड फ़ाइल सेव करें', 'data.restore': 'बैकअप से लाएँ',
    'data.restoreSub': '.svbak फ़ाइल चुनें', 'data.pass': 'बैकअप पासवर्ड',
    'data.wipe': 'सारा डेटा मिटाएँ', 'data.wipeAsk': 'सब कुछ मिटाएँ?',
    'data.wipeMsg': 'सारी सेवाएँ, भंडारे और सेटिंग्स हट जाएँगी। पहले बैकअप ले लें।',
    'data.records': 'रिकॉर्ड', 'data.stored': 'संग्रहित', 'data.vaultInfo': 'आपकी डायरी इसी फ़ोन में, एन्क्रिप्टेड रहती है — कोई सर्वर नहीं।',
    'update.title': 'ऐप अपडेट', 'update.current': 'अभी का वर्शन', 'update.check': 'अपडेट जाँचें',
    'update.checking': 'जाँच रहे हैं…', 'update.available': 'नया अपडेट उपलब्ध',
    'update.latest': 'आप नवीनतम वर्शन पर हैं', 'update.notes': 'नया क्या है',
    'update.files': 'फ़ाइलें', 'update.size': 'डाउनलोड', 'update.now': 'अभी अपडेट करें',
    'update.later': 'बाद में', 'update.downloading': 'डाउनलोड हो रहा है',
    'update.applying': 'लागू कर रहे हैं…', 'update.done': 'अपडेट पूरा हुआ',
    'update.restart': 'अभी चालू करें', 'update.failed': 'अपडेट विफल', 'update.rollback': 'पिछले वर्शन पर लौटें',
    'update.auto': 'अपने आप अपडेट', 'update.autoSub': 'ऐप खोलते ही नया वर्शन जाँचें',
    'update.notify': 'अपडेट सूचना', 'update.notifySub': 'नया वर्शन आने पर नोटिफिकेशन',
    'update.history': 'अपडेट इतिहास', 'update.apk': 'ऐप इंस्टॉल अपडेट',
    'update.apkNote': 'नए फ़ीचर के लिए पूरा ऐप इंस्टॉल करना होगा। आपका डेटा सुरक्षित रहेगा।',
    'update.install': 'इंस्टॉल करें', 'update.permission': 'इंस्टॉल की अनुमति दें',
    'update.offline': 'इंटरनेट नहीं है', 'update.lastCheck': 'आख़िरी जाँच',
    'update.web': 'ऐप सामग्री', 'update.shell': 'ऐप कोर', 'update.onlyChanged': 'सिर्फ़ बदली फ़ाइलें डाउनलोड होंगी',
    'update.mandatory': 'यह अपडेट ज़रूरी है', 'update.advanced': 'एडवांस', 'update.source': 'अपडेट स्रोत',
    'update.reset': 'मूल वर्शन पर लौटें', 'update.noChange': 'कुछ नहीं बदला',
    'perm.title': 'अनुमतियाँ', 'perm.notif': 'नोटिफिकेशन', 'perm.notifSub': 'सेवा रिमाइंडर और अपडेट सूचना',
    'perm.install': 'ऐप इंस्टॉल', 'perm.installSub': 'नया वर्शन स्वयं इंस्टॉल करने के लिए',
    'perm.storage': 'स्टोरेज', 'perm.storageSub': 'बैनर गैलरी में सेव करने के लिए',
    'perm.battery': 'बैटरी अनुकूलन', 'perm.batterySub': 'रिमाइंडर समय पर आने के लिए बंद करें',
    'perm.alarm': 'सटीक अलार्म', 'perm.alarmSub': 'ठीक समय पर रिमाइंडर',
    'perm.grant': 'अनुमति दें', 'perm.granted': 'चालू', 'perm.denied': 'बंद', 'perm.open': 'खोलें',
    'common.save': 'सेव करें', 'common.cancel': 'रद्द करें', 'common.delete': 'हटाएँ',
    'common.edit': 'बदलें', 'common.close': 'बंद करें', 'common.done': 'हो गया', 'common.ok': 'ठीक है',
    'common.yes': 'हाँ', 'common.no': 'नहीं', 'common.back': 'पीछे', 'common.share': 'शेयर',
    'common.add': 'जोड़ें', 'common.today': 'आज', 'common.yesterday': 'कल', 'common.loading': 'लोड हो रहा है…',
    'common.error': 'कुछ गड़बड़ हुई', 'common.retry': 'फिर कोशिश करें', 'common.on': 'चालू', 'common.off': 'बंद',
    'common.min': 'मिनट', 'common.optional': 'वैकल्पिक',
    'time.now': 'अभी', 'time.min': 'मिनट पहले', 'time.hour': 'घंटे पहले', 'time.day': 'दिन पहले',
    'toast.sevaAdded': 'सेवा दर्ज हो गई 🙏', 'toast.saved': 'सेव हो गया', 'toast.deleted': 'हटा दिया गया',
    'toast.copied': 'कॉपी हो गया', 'toast.imageSaved': 'गैलरी में सेव हो गया',
    'toast.pinSet': 'पिन लग गया', 'toast.pinRemoved': 'पिन हट गया', 'toast.langChanged': 'भाषा बदल गई',
    'toast.backupDone': 'बैकअप तैयार', 'toast.restoreDone': 'डेटा वापस आ गया', 'toast.wiped': 'डेटा मिटा दिया',
    'toast.eventSaved': 'भंडारा सेव हो गया', 'toast.reminderSet': 'रिमाइंडर लग गया',
    'about.desc': 'संत रामपाल जी महाराज के साधकों के लिए दैनिक सेवा, साधना और भंडारा प्रबंधन — पूरी तरह ऑफ़लाइन, पूरी तरह निजी।',
    'about.privacy': 'आपका डेटा कभी फ़ोन से बाहर नहीं जाता', 'about.version': 'वर्शन',
    'about.build': 'बिल्ड', 'about.device': 'डिवाइस', 'about.madeWith': 'भक्ति भाव से निर्मित',
    'onb.title': 'जय सतनाम 🙏', 'onb.sub': 'अपनी सेवा डायरी शुरू करें',
    'onb.name': 'आपका नाम', 'onb.start': 'शुरू करें', 'onb.skip': 'अभी नहीं',
    'onb.p1': 'रोज़ की सेवा दर्ज करें', 'onb.p1s': 'नाम जप, सत्संग, पाठ, भंडारा — एक जगह',
    'onb.p2': 'भंडारा बैनर बनाएँ', 'onb.p2s': 'सुंदर बैनर बनाकर तुरंत शेयर करें',
    'onb.p3': 'पूरी तरह निजी', 'onb.p3s': 'एन्क्रिप्टेड, ऑफ़लाइन, कोई खाता नहीं'
  };
  hi['profile.member'] = 'साधक';

  var en = {
    'app.name': 'Seva Sagar',
    'app.tag': 'Sant Rampal Ji Maharaj · Devotee Seva Diary',
    'nav.home': 'Home', 'nav.seva': 'Seva', 'nav.bhandara': 'Bhandara', 'nav.profile': 'Profile',
    'greet.line': 'Ram Sat Naam', 'greet.morning': 'Good morning', 'greet.afternoon': 'Namaskar',
    'greet.evening': 'Good evening', 'greet.night': 'Good night', 'greet.friend': 'Devotee',
    'home.today': "Today's Sadhana", 'home.target': 'Target', 'home.completed': 'Done',
    'home.streak': 'Streak', 'home.days': 'days', 'home.addSeva': 'Log seva',
    'home.quick': 'Quick seva', 'home.todayList': "Today's entries", 'home.viewAll': 'View all',
    'home.empty': 'No seva logged today', 'home.emptySub': 'Tap + below to add your first seva',
    'home.week': 'This week', 'home.thought': 'Thought for today', 'home.remaining': 'left',
    'home.done': "Today's target complete! Wonderful 🙏",
    'seva.title': 'Seva Diary', 'seva.all': 'All', 'seva.add': 'Log seva', 'seva.edit': 'Edit seva',
    'seva.count': 'Quantity', 'seva.note': 'Note', 'seva.notePh': 'How was today…',
    'seva.place': 'Place', 'seva.placePh': 'Ashram / home / satsang venue', 'seva.date': 'Date',
    'seva.type': 'Type of seva', 'seva.empty': 'No seva found', 'seva.emptySub': 'This month’s seva will appear here',
    'seva.calendar': 'Seva calendar', 'seva.monthTotal': 'This month', 'seva.deleteAsk': 'Delete this seva?',
    'seva.deleteMsg': 'This entry will be removed permanently.', 'seva.entries': 'entries',
    'type.naam': 'Naam Jaap', 'type.satsang': 'Satsang', 'type.path': 'Reading',
    'type.bhandara': 'Bhandara Seva', 'type.prachar': 'Prachar Seva', 'type.daan': 'Daan',
    'unit.mala': 'mala', 'unit.minute': 'min', 'unit.page': 'pages', 'unit.hour': 'hrs', 'unit.count': 'count',
    'bhandara.title': 'Bhandara', 'bhandara.make': 'Create banner', 'bhandara.mine': 'My bhandaras',
    'bhandara.template': 'Choose design', 'bhandara.eventName': 'Event name', 'bhandara.date': 'Date',
    'bhandara.time': 'Time', 'bhandara.venue': 'Venue', 'bhandara.venuePh': 'Ashram / village / city',
    'bhandara.organizer': 'Organiser', 'bhandara.organizerPh': 'Your name / committee',
    'bhandara.phone': 'Contact number', 'bhandara.message': 'Message', 'bhandara.preview': 'Preview',
    'bhandara.share': 'Share', 'bhandara.saveImg': 'Save to gallery', 'bhandara.saveEvent': 'Save bhandara',
    'bhandara.empty': 'No bhandara saved yet', 'bhandara.emptySub': 'Create a banner and save the event — reminders are automatic',
    'bhandara.remind': 'Reminder', 'bhandara.upcoming': 'Upcoming', 'bhandara.past': 'Completed',
    'bhandara.daysLeft': 'days left', 'bhandara.todayIs': 'Today!', 'bhandara.defaultTitle': 'Vishal Bhandara',
    'bhandara.invite': 'Come with family', 'bhandara.blessings': 'By the grace of Sant Rampal Ji Maharaj',
    'bhandara.free': 'Free Satsang & Bhandara', 'bhandara.allWelcome': 'All seekers are warmly welcome',
    'profile.title': 'Profile', 'profile.edit': 'Edit profile', 'profile.name': 'Name',
    'profile.namePh': 'Your name', 'profile.city': 'Village / City', 'profile.initiated': 'Naam Diksha date',
    'profile.stats': 'Seva stats', 'profile.settings': 'Settings', 'profile.language': 'Language',
    'profile.theme': 'Theme', 'profile.accent': 'Accent', 'profile.reminders': 'Seva reminder',
    'profile.remindersSub': 'Remind me daily at a set time', 'profile.notifications': 'Notifications',
    'profile.data': 'Data & security', 'profile.update': 'App update', 'profile.permissions': 'Permissions',
    'profile.about': 'About', 'profile.totalSeva': 'Total seva', 'profile.best': 'Best streak',
    'profile.active': 'Active days', 'profile.malas': 'Total mala', 'profile.member': 'Sadhak',
    'theme.system': 'System', 'theme.light': 'Light', 'theme.dark': 'Dark', 'theme.amoled': 'AMOLED',
    'lang.hi': 'हिन्दी', 'lang.en': 'English', 'lang.pa': 'ਪੰਜਾਬੀ', 'lang.hr': 'हरियाणवी',
    'data.enc': 'Encryption', 'data.comp': 'Compression', 'data.savedSpace': 'Saved',
    'data.pin': 'PIN lock', 'data.pinSub': 'Ask for a PIN to open the diary', 'data.pinSet': 'Set PIN',
    'data.pinRemove': 'Remove PIN', 'data.pinEnter': 'Enter PIN', 'data.pinWrong': 'Wrong PIN',
    'data.pinNew': 'New PIN (at least 4 digits)', 'data.backup': 'Create backup',
    'data.backupSub': 'Save an encrypted file', 'data.restore': 'Restore backup',
    'data.restoreSub': 'Pick a .svbak file', 'data.pass': 'Backup password',
    'data.wipe': 'Erase all data', 'data.wipeAsk': 'Erase everything?',
    'data.wipeMsg': 'All seva, bhandaras and settings will be deleted. Take a backup first.',
    'data.records': 'Records', 'data.stored': 'Stored', 'data.vaultInfo': 'Your diary stays on this phone, encrypted — no server.',
    'update.title': 'App update', 'update.current': 'Current version', 'update.check': 'Check for update',
    'update.checking': 'Checking…', 'update.available': 'New update available', 'update.latest': 'You are on the latest version',
    'update.notes': "What's new", 'update.files': 'Files', 'update.size': 'Download',
    'update.now': 'Update now', 'update.later': 'Later', 'update.downloading': 'Downloading',
    'update.applying': 'Applying…', 'update.done': 'Update complete', 'update.restart': 'Restart now',
    'update.failed': 'Update failed', 'update.rollback': 'Roll back to previous version',
    'update.auto': 'Auto update', 'update.autoSub': 'Check for a new version when the app opens',
    'update.notify': 'Update notifications', 'update.notifySub': 'Notify me when a new version is published',
    'update.history': 'Update history', 'update.apk': 'Full app update',
    'update.apkNote': 'New native features need a full install. Your data stays safe.',
    'update.install': 'Install', 'update.permission': 'Allow install permission',
    'update.offline': 'No internet connection', 'update.lastCheck': 'Last check',
    'update.web': 'App content', 'update.shell': 'App core', 'update.onlyChanged': 'Only changed files are downloaded',
    'update.mandatory': 'This update is required', 'update.advanced': 'Advanced', 'update.source': 'Update source',
    'update.reset': 'Reset to bundled version', 'update.noChange': 'Nothing changed',
    'perm.title': 'Permissions', 'perm.notif': 'Notifications', 'perm.notifSub': 'Seva reminders and update alerts',
    'perm.install': 'Install apps', 'perm.installSub': 'Needed to install new versions',
    'perm.storage': 'Storage', 'perm.storageSub': 'To save banners to your gallery',
    'perm.battery': 'Battery optimisation', 'perm.batterySub': 'Turn off so reminders arrive on time',
    'perm.alarm': 'Exact alarms', 'perm.alarmSub': 'Reminders at the exact minute',
    'perm.grant': 'Allow', 'perm.granted': 'On', 'perm.denied': 'Off', 'perm.open': 'Open',
    'common.save': 'Save', 'common.cancel': 'Cancel', 'common.delete': 'Delete', 'common.edit': 'Edit',
    'common.close': 'Close', 'common.done': 'Done', 'common.ok': 'OK', 'common.yes': 'Yes', 'common.no': 'No',
    'common.back': 'Back', 'common.share': 'Share', 'common.add': 'Add', 'common.today': 'Today',
    'common.yesterday': 'Yesterday', 'common.loading': 'Loading…', 'common.error': 'Something went wrong',
    'common.retry': 'Retry', 'common.on': 'On', 'common.off': 'Off', 'common.min': 'min', 'common.optional': 'optional',
    'time.now': 'just now', 'time.min': 'min ago', 'time.hour': 'hr ago', 'time.day': 'days ago',
    'toast.sevaAdded': 'Seva logged 🙏', 'toast.saved': 'Saved', 'toast.deleted': 'Deleted',
    'toast.copied': 'Copied', 'toast.imageSaved': 'Saved to gallery', 'toast.pinSet': 'PIN set',
    'toast.pinRemoved': 'PIN removed', 'toast.langChanged': 'Language changed', 'toast.backupDone': 'Backup ready',
    'toast.restoreDone': 'Data restored', 'toast.wiped': 'Data erased', 'toast.eventSaved': 'Bhandara saved',
    'toast.reminderSet': 'Reminder set',
    'about.desc': 'Daily seva, sadhana and bhandara management for followers of Sant Rampal Ji Maharaj — fully offline, fully private.',
    'about.privacy': 'Your data never leaves your phone', 'about.version': 'Version',
    'about.build': 'Build', 'about.device': 'Device', 'about.madeWith': 'Made with devotion',
    'onb.title': 'Jai Satnaam 🙏', 'onb.sub': 'Start your seva diary', 'onb.name': 'Your name',
    'onb.start': 'Get started', 'onb.skip': 'Not now',
    'onb.p1': 'Log daily seva', 'onb.p1s': 'Naam jaap, satsang, reading, bhandara — in one place',
    'onb.p2': 'Create bhandara banners', 'onb.p2s': 'Beautiful banners you can share instantly',
    'onb.p3': 'Completely private', 'onb.p3s': 'Encrypted, offline, no account needed'
  };

  var pa = {
    'app.tag': 'ਸੰਤ ਰਾਮਪਾਲ ਜੀ ਮਹਾਰਾਜ · ਭਗਤ ਸੇਵਾ ਡਾਇਰੀ',
    'nav.home': 'ਹੋਮ', 'nav.seva': 'ਸੇਵਾ', 'nav.bhandara': 'ਭੰਡਾਰਾ', 'nav.profile': 'ਪ੍ਰੋਫਾਈਲ',
    'greet.line': 'ਰਾਮ ਸਤ ਨਾਮ', 'greet.morning': 'ਸ਼ੁਭ ਸਵੇਰ', 'greet.evening': 'ਸ਼ੁਭ ਸੰਧਿਆ',
    'greet.night': 'ਸ਼ੁਭ ਰਾਤ', 'greet.friend': 'ਭਗਤ',
    'home.today': 'ਅੱਜ ਦੀ ਸਾਧਨਾ', 'home.target': 'ਟੀਚਾ', 'home.completed': 'ਪੂਰਾ',
    'home.streak': 'ਲਗਾਤਾਰ', 'home.days': 'ਦਿਨ', 'home.addSeva': 'ਸੇਵਾ ਜੋੜੋ',
    'home.quick': 'ਤੁਰੰਤ ਸੇਵਾ', 'home.todayList': 'ਅੱਜ ਦਾ ਲੇਖਾ', 'home.viewAll': 'ਸਭ ਵੇਖੋ',
    'home.empty': 'ਅੱਜ ਕੋਈ ਸੇਵਾ ਦਰਜ ਨਹੀਂ', 'home.emptySub': 'ਹੇਠਾਂ + ਦਬਾ ਕੇ ਪਹਿਲੀ ਸੇਵਾ ਜੋੜੋ',
    'home.week': 'ਇਸ ਹਫ਼ਤੇ', 'home.thought': 'ਅੱਜ ਦਾ ਸੁਵਿਚਾਰ', 'home.remaining': 'ਬਾਕੀ',
    'home.done': 'ਅੱਜ ਦਾ ਟੀਚਾ ਪੂਰਾ! ਬਹੁਤ ਵਧੀਆ 🙏',
    'seva.title': 'ਸੇਵਾ ਡਾਇਰੀ', 'seva.all': 'ਸਭ', 'seva.add': 'ਸੇਵਾ ਦਰਜ ਕਰੋ', 'seva.edit': 'ਸੇਵਾ ਬਦਲੋ',
    'seva.count': 'ਮਾਤਰਾ', 'seva.note': 'ਟਿੱਪਣੀ', 'seva.place': 'ਥਾਂ', 'seva.date': 'ਤਾਰੀਖ',
    'seva.type': 'ਸੇਵਾ ਦੀ ਕਿਸਮ', 'seva.empty': 'ਕੋਈ ਸੇਵਾ ਨਹੀਂ ਮਿਲੀ', 'seva.calendar': 'ਸੇਵਾ ਕੈਲੰਡਰ',
    'seva.monthTotal': 'ਇਸ ਮਹੀਨੇ', 'seva.entries': 'ਐਂਟਰੀਆਂ',
    'type.naam': 'ਨਾਮ ਜਾਪ', 'type.satsang': 'ਸਤਸੰਗ', 'type.path': 'ਪਾਠ',
    'type.bhandara': 'ਭੰਡਾਰਾ ਸੇਵਾ', 'type.prachar': 'ਪ੍ਰਚਾਰ ਸੇਵਾ', 'type.daan': 'ਦਾਨ',
    'unit.mala': 'ਮਾਲਾ', 'unit.minute': 'ਮਿੰਟ', 'unit.page': 'ਪੰਨੇ', 'unit.hour': 'ਘੰਟੇ', 'unit.count': 'ਗਿਣਤੀ',
    'bhandara.title': 'ਭੰਡਾਰਾ', 'bhandara.make': 'ਬੈਨਰ ਬਣਾਓ', 'bhandara.mine': 'ਮੇਰੇ ਭੰਡਾਰੇ',
    'bhandara.eventName': 'ਸਮਾਗਮ ਦਾ ਨਾਮ', 'bhandara.venue': 'ਥਾਂ', 'bhandara.organizer': 'ਪ੍ਰਬੰਧਕ',
    'bhandara.phone': 'ਸੰਪਰਕ ਨੰਬਰ', 'bhandara.share': 'ਸਾਂਝਾ ਕਰੋ', 'bhandara.saveImg': 'ਗੈਲਰੀ ਵਿੱਚ ਸੇਵ',
    'bhandara.defaultTitle': 'ਵਿਸ਼ਾਲ ਭੰਡਾਰਾ', 'bhandara.invite': 'ਸਪਰਿਵਾਰ ਪਧਾਰੋ',
    'bhandara.blessings': 'ਸੰਤ ਰਾਮਪਾਲ ਜੀ ਮਹਾਰਾਜ ਦੀ ਕਿਰਪਾ ਨਾਲ',
    'profile.title': 'ਪ੍ਰੋਫਾਈਲ', 'profile.name': 'ਨਾਮ', 'profile.city': 'ਪਿੰਡ / ਸ਼ਹਿਰ',
    'profile.language': 'ਭਾਸ਼ਾ', 'profile.theme': 'ਥੀਮ', 'profile.accent': 'ਰੰਗ',
    'profile.settings': 'ਸੈਟਿੰਗਾਂ', 'profile.update': 'ਐਪ ਅੱਪਡੇਟ', 'profile.about': 'ਐਪ ਬਾਰੇ',
    'common.save': 'ਸੇਵ ਕਰੋ', 'common.cancel': 'ਰੱਦ ਕਰੋ', 'common.delete': 'ਹਟਾਓ',
    'common.today': 'ਅੱਜ', 'common.yesterday': 'ਕੱਲ੍ਹ',
    'update.title': 'ਐਪ ਅੱਪਡੇਟ', 'update.check': 'ਅੱਪਡੇਟ ਵੇਖੋ', 'update.now': 'ਹੁਣੇ ਅੱਪਡੇਟ ਕਰੋ',
    'update.available': 'ਨਵਾਂ ਅੱਪਡੇਟ ਮੌਜੂਦ', 'update.latest': 'ਤੁਸੀਂ ਨਵੀਨਤਮ ਵਰਜਨ ਤੇ ਹੋ',
    'toast.sevaAdded': 'ਸੇਵਾ ਦਰਜ ਹੋ ਗਈ 🙏', 'onb.title': 'ਜੈ ਸਤਨਾਮ 🙏'
  };

  var hr = {
    'greet.morning': 'राम-राम', 'greet.afternoon': 'राम-राम', 'greet.friend': 'भाई',
    'home.today': 'आज की कमाई', 'home.addSeva': 'सेवा चढ़ा दे', 'home.quick': 'फटाफट सेवा',
    'home.todayList': 'आज का हिसाब', 'home.empty': 'आज तो खाता खाली पड़्या है',
    'home.emptySub': 'नीचे + दबा दे अर पहली सेवा चढ़ा दे', 'home.done': 'आज का लक्ष्य पूरा कर लिया! घणा बढ़िया 🙏',
    'home.streak': 'रोज़ाना', 'home.days': 'दिन',
    'seva.add': 'सेवा चढ़ा दे', 'seva.empty': 'कोई सेवा कोनी मिली',
    'seva.emptySub': 'इस महीने की सेवावां इब दिखैंगी',
    'bhandara.mine': 'म्हारे भंडारे', 'bhandara.make': 'बैनर बना दे',
    'bhandara.empty': 'अबै कोई भंडारा सेव कोनी', 'bhandara.invite': 'सपरिवार पधारो',
    'profile.city': 'गाम / शहर', 'profile.name': 'नाम',
    'common.save': 'सेव कर दे', 'common.cancel': 'रैण दे', 'common.delete': 'काढ़ दे',
    'common.today': 'आज', 'common.yesterday': 'काल',
    'toast.sevaAdded': 'सेवा चढ़ गई 🙏', 'toast.saved': 'सेव हो गया',
    'update.now': 'इब्बे अपडेट कर दे', 'update.check': 'अपडेट देख ले',
    'onb.title': 'राम-राम जी 🙏', 'onb.sub': 'आपणी सेवा डायरी शुरू कर ले'
  };

  var DICT = { hi: hi, en: en, pa: pa, hr: hr };
  var MONTHS = {
    hi: ['जनवरी','फ़रवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितम्बर','अक्टूबर','नवम्बर','दिसम्बर'],
    en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    pa: ['ਜਨਵਰੀ','ਫ਼ਰਵਰੀ','ਮਾਰਚ','ਅਪ੍ਰੈਲ','ਮਈ','ਜੂਨ','ਜੁਲਾਈ','ਅਗਸਤ','ਸਤੰਬਰ','ਅਕਤੂਬਰ','ਨਵੰਬਰ','ਦਸੰਬਰ'],
    hr: ['जनवरी','फ़रवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितम्बर','अक्टूबर','नवम्बर','दिसम्बर']
  };
  var DAYS = {
    hi: ['रवि','सोम','मंगल','बुध','गुरु','शुक्र','शनि'],
    en: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
    pa: ['ਐਤ','ਸੋਮ','ਮੰਗਲ','ਬੁੱਧ','ਵੀਰ','ਸ਼ੁੱਕਰ','ਸ਼ਨੀ'],
    hr: ['रवि','सोम','मंगल','बुध','गुरु','शुक्र','शनि']
  };

  var lang = 'hi';
  function t(key, vars) {
    var d = DICT[lang] || hi;
    var s = d[key];
    if (s == null) s = hi[key];
    if (s == null) s = en[key];
    if (s == null) return key;
    if (vars) for (var k in vars) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }
  function setLang(l) {
    lang = DICT[l] ? l : 'hi';
    document.documentElement.setAttribute('lang', lang);
    if (window.Seva && Seva.db) { Seva.db.settings.lang = lang; Seva.save(); }
  }
  function applyDom(root) {
    (root || document).querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    (root || document).querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
    });
  }
  S.t = t;
  S.i18n = {
    set: setLang,
    get: function () { return lang; },
    apply: applyDom,
    months: function () { return MONTHS[lang] || MONTHS.hi; },
    days: function () { return DAYS[lang] || DAYS.hi; },
    date: function (key, opts) {
      var d = typeof key === 'string' ? S.u.parseKey(key) : key;
      var m = (MONTHS[lang] || MONTHS.hi)[d.getMonth()];
      var mn = lang === 'en' ? m.slice(0, 3) : m;
      if (opts === 'short') return d.getDate() + ' ' + mn;
      if (opts === 'full') return (DAYS[lang] || DAYS.hi)[d.getDay()] + ', ' + d.getDate() + ' ' + mn + ' ' + d.getFullYear();
      return d.getDate() + ' ' + mn + ' ' + d.getFullYear();
    }
  };
})();
