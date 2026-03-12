import express from "express";
import { userRoutes } from "../modules/User/user.routes";
import { authRoutes } from "../modules/Auth/auth.routes";
import { permissionRoutes } from "../modules/Access_control/access_control.routes";
import { categoryRoutes } from "../modules/Adviser_management/Category/category.routes";
import { specialityRoutes } from "../modules/Adviser_management/Speciality/speciality.routes";
import { languageRoutes } from "../modules/Adviser_management/Language/language.routes";
import { adviserLanguageRoutes } from "../modules/Adviser_management/AdviserLanguage/adviserLanguage.routes";
import { educationRoutes } from "../modules/Adviser_management/Education/education.routes";
import { favoriteRoutes } from "../modules/Favorite/favorite.routes";
import { adviserRoutes } from "../modules/Adviser_management/Adviser/adviser.routes";
import { scheduleRoutes } from "../modules/Adviser_management/Schedule/schedule.routes";
import { autoScheduleRoutes } from "../modules/Adviser_management/AutoSchedule/autoSchedule.routes";
import { appointmentRoutes } from "../modules/Adviser_management/Appointment/appointment.routes";
import { quick_book_Routes } from "../modules/Adviser_management/Quick_book/Main_Quick_Book/quick_book.routes";
import { RatingAndFeedbackRoutes } from "../modules/Rating_and_feedback/rating_and_feedback.routes";
import { client_dashboardRoutes } from "../modules/Dashboard/Client_dashboard/client_dashboard.routes";
import { admin_dashboardRoutes } from "../modules/Dashboard/Admin_dashboard/admin_dashboard.routes";
import { adviser_dashboardRoutes } from "../modules/Dashboard/Adviser_dashboard/adviser_dashboard.routes";
import { serviceRoutes } from "../modules/Adviser_management/Service/service.routes";
import { blogRoutes } from "../modules/Adviser_management/Blog/blog.main.routes";
import { virtualCallRoutes } from "../modules/Virtual_call/virtual_call.routes";
import { prescriptionRoutes } from "../modules/Adviser_management/Prescription/prescription.routes";
import { PaymentMethodsRoute } from "../modules/Payment_module_&_methods/Methods/payment.methods.routes";
import { UniversalAPiRoutes } from "../modules/universal_api/universal_api.routes";
import { clientRoutes } from "../modules/Client_management/client.routes";
import { livekitRoutes } from "../modules/livekit/livekit.routes";
import { NotificationRoute } from "../modules/Notification/notification.routes";
import { walletRoutes } from "../modules/Wallet/wallet.routes";
import path from "path";
import { postRoutes } from "../modules/Post/post.routes";
import { FollowRoutes } from "../modules/follow_system/follow_system.router";
import { chatRoutes } from "../modules/chat/chat.routes";
import { ProfileViewRouter } from "../modules/ProfileView/ProfileView.router";
import { SavePostRouter } from "../modules/save_post/save_post_router";
import { reviewRouter } from "../modules/review/review.router";
import { DatabaseRoutes } from "../modules/Database/database.routes";
import { transectionRouter } from "../modules/tramsectopm/transection.router";
import { orderRouter as orderRoutes } from "../modules/Adviser_management/order/order.routes";
import { ChatPackageRoutes } from "../modules/ChatPackage/chatPackage.routes";
import uploadRoutes from "../modules/Upload/upload.routes";
import { quick_book_appointment_Routes } from "../modules/Adviser_management/Quick_book/Quick_book_appointment/quick_book_appointment.routes";
import { admin_dashboard_metricsRoutes } from "../modules/Dashboard/Admin_dashboard/DashboardMetrics/dashboard_metrics.routes";

const router = express.Router();

// main entry point module routes
const moduleRoutes = [
  {
    path: "/save-post",
    route: SavePostRouter,
  },

  {
    path: "/auth",
    route: authRoutes,
  },
  {
    path: "/post",
    route: postRoutes,
  },

  {
    path: "/chat",
    route: chatRoutes,
  },

  {
    path: "/chat-packages",
    route: ChatPackageRoutes,
  },

  {
    path: "/access-control",
    route: permissionRoutes,
  },
  {
    path: "/user",
    route: userRoutes,
  },
  {
    path: "/category",
    route: categoryRoutes,
  },
  {
    path: "/speciality",
    route: specialityRoutes,
  },
  {
    path: "/language",
    route: languageRoutes,
  },
  {
    path: "/adviser-language",
    route: adviserLanguageRoutes,
  },
  {
    path: "/education",
    route: educationRoutes,
  },
  {
    path: "/adviser",
    route: adviserRoutes,
  },
  {
    path: "/service",
    route: serviceRoutes,
  },
  {
    path: "/rating_and_feedback",
    route: RatingAndFeedbackRoutes,
  },
  {
    path: "/appointment",
    route: appointmentRoutes,
  },
  {
    path: "/quick_book",
    route: quick_book_Routes,
  },
  {
    path: "/schedule",
    route: scheduleRoutes,
  },
  {
    path: "/auto-schedule",
    route: autoScheduleRoutes,
  },
  {
    path: "/secure-pay",
    route: PaymentMethodsRoute,
  },
  {
    path: "/favorite",
    route: favoriteRoutes,
  },
  {
    path: "/notification",
    route: NotificationRoute,
  },
  {
    path: "/blog",
    route: blogRoutes,
  },
  {
    path: "/client_dashboard",
    route: client_dashboardRoutes,
  },
  {
    path: "/adviser_dashboard",
    route: adviser_dashboardRoutes,
  },

  {
    path: "/admin_dashboard",
    route: admin_dashboardRoutes,
  },
  {
    path: "/virtual_call",
    route: virtualCallRoutes,
  },
  {
    path: "/prescription",
    route: prescriptionRoutes,
  },
  {
    path: "/follow",
    route: FollowRoutes,
  },
  {
    path: "/universal_api",
    route: UniversalAPiRoutes,
  },
  {
    path: "/client",
    route: clientRoutes,
  },
  {
    path: "/profile-view",
    route: ProfileViewRouter,
  },
  {
    path: "/review",
    route: reviewRouter,
  },
  {
    path: "/save-post",
    route: SavePostRouter,
  },
  {
    path: "/transection",
    route: transectionRouter,
  },
  {
    path: "/quickbook",
    route: quick_book_appointment_Routes,
  },
  {
    path: "/dashboard_information",
    route: admin_dashboard_metricsRoutes,
  },
  { path: "/livekit", route: livekitRoutes },
  { path: "/wallet", route: walletRoutes },
  { path: "/database", route: DatabaseRoutes },
  { path: "/order", route: orderRoutes },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));

// Add upload route
router.use("/upload", uploadRoutes);

export default router;
