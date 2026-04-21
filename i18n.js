import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Login Screen
      "login.title": "ProjectFlow",
      "login.subtitle": "MANAGEMENT PLATFORM",
      "login.company": "Company Name",
      "login.key": "Access Key",
      "login.signin": "Sign In",
      "login.error": "Login failed",
      "login.errorMessage": "Company or access key is incorrect. Try again or contact your administrator.",
      "login.used": "This access key has already been used. Contact your administrator for a new key.",
      "login.help": "💡 Need an access key? Contact your administrator for registration.",

      // Header
      "header.logout": "Logout",

      // Stats
      "stats.total": "Total Projects",
      "stats.estimating": "Estimating",
      "stats.progress": "In Progress",
      "stats.closed": "Closed",
      "stats.critical": "Critical",

      // Form
      "form.add": "➕ Project Data",
      "form.edit": "✏️ Edit Project",
      "form.clientName": "Client Name",
      "form.phone": "Phone",
      "form.email": "Email",
      "form.caseType": "Case Type",
      "form.dateOfSending": "Date Of Sending",
      "form.status": "Status",
      "form.priority": "Priority",
      "form.tags": "Tags (comma separated)",
      "form.assignedTo": "Assigned To",
      "form.notes": "Notes",
      "form.addButton": "➕ Add",
      "form.updateButton": "💾 Update",
      "form.cancel": "✕ Cancel",

      // Status Options
      "status.estimating": "Estimating",
      "status.progress": "In Progress",
      "status.closed": "Closed",
      "status.hold": "On Hold",

      // Priority Options
      "priority.low": "Low",
      "priority.medium": "Medium",
      "priority.high": "High",
      "priority.critical": "Critical",

      // Projects List
      "projects.search": "🔍 Search projects...",
      "projects.filter": "All",
      "projects.noProjects": "✨ No projects found. Create one to get started!",
      "projects.edit": "✏️ Edit",
      "projects.delete": "🗑️ Delete",

      // Project Details
      "details.status": "Status",
      "details.edit": "✏️ Edit",
      "details.delete": "🗑️ Delete",
      "details.phone": "Phone",
      "details.email": "Email",
      "details.type": "Type",
      "details.assigned": "Assigned To",
      "details.created": "Created",
      "details.updated": "Updated",
      "details.notes": "Notes",
      "details.files": "📎 Files",
      "details.upload": "➕ Upload File",
      "details.noFiles": "No files uploaded yet. Upload files to store them with this project!",
      "details.download": "⬇️",
      "details.remove": "✕",

      // Language
      "language": "Language",
      "language.en": "English",
      "language.ar": "العربية"
    }
  },
  ar: {
    translation: {
      // Login Screen
      "login.title": "ProjectFlow",
      "login.subtitle": "منصة الإدارة",
      "login.company": "اسم الشركة",
      "login.key": "مفتاح الوصول",
      "login.signin": "تسجيل الدخول",
      "login.error": "فشل تسجيل الدخول",
      "login.errorMessage": "اسم الشركة أو مفتاح الوصول غير صحيح. حاول مرة أخرى أو اتصل بالمسؤول.",
      "login.used": "تم استخدام مفتاح الوصول هذا بالفعل. اتصل بالمسؤول للحصول على مفتاح جديد.",
      "login.help": "💡 تحتاج مفتاح وصول؟ اتصل بالمسؤول للتسجيل.",

      // Header
      "header.logout": "تسجيل الخروج",

      // Stats
      "stats.total": "إجمالي المشاريع",
      "stats.estimating": "قيد التقدير",
      "stats.progress": "قيد التنفيذ",
      "stats.closed": "مغلق",
      "stats.critical": "حرج",

      // Form
      "form.add": "➕ بيانات المشروع",
      "form.edit": "✏️ تعديل المشروع",
      "form.clientName": "اسم العميل",
      "form.phone": "الهاتف",
      "form.email": "البريد الإلكتروني",
      "form.caseType": "نوع القضية",
      "form.dateOfSending": "تاريخ الإرسال",
      "form.status": "الحالة",
      "form.priority": "الأولوية",
      "form.tags": "العلامات (مفصولة بفواصل)",
      "form.assignedTo": "مُسند إلى",
      "form.notes": "ملاحظات",
      "form.addButton": "➕ إضافة",
      "form.updateButton": "💾 تحديث",
      "form.cancel": "✕ إلغاء",

      // Status Options
      "status.estimating": "قيد التقدير",
      "status.progress": "قيد التنفيذ",
      "status.closed": "مغلق",
      "status.hold": "متوقف",

      // Priority Options
      "priority.low": "منخفض",
      "priority.medium": "متوسط",
      "priority.high": "عالي",
      "priority.critical": "حرج",

      // Projects List
      "projects.search": "🔍 البحث في المشاريع...",
      "projects.filter": "الكل",
      "projects.noProjects": "✨ لم يتم العثور على مشاريع. أنشئ واحداً للبدء!",
      "projects.edit": "✏️ تعديل",
      "projects.delete": "🗑️ حذف",

      // Project Details
      "details.status": "الحالة",
      "details.edit": "✏️ تعديل",
      "details.delete": "🗑️ حذف",
      "details.phone": "الهاتف",
      "details.email": "البريد الإلكتروني",
      "details.type": "النوع",
      "details.assigned": "مُسند إلى",
      "details.created": "تاريخ الإنشاء",
      "details.updated": "تاريخ التحديث",
      "details.notes": "ملاحظات",
      "details.files": "📎 الملفات",
      "details.upload": "➕ رفع ملف",
      "details.noFiles": "لم يتم رفع ملفات بعد. ارفع ملفات لتخزينها مع هذا المشروع!",
      "details.download": "⬇️",
      "details.remove": "✕",

      // Language
      "language": "اللغة",
      "language.en": "English",
      "language.ar": "العربية"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,

    interpolation: {
      escapeValue: false,
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;