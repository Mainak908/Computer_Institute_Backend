import { Router } from "express";
import {
  AllEnrollments,
  deActivateEnrollment,
  ActivateEnrollment,
  createEnrollment,
  generateCertificate,
  generateadmit,
  generateMarksheet,
  generateId,
  createCourse,
  exmformfillupDatafetch,
  exmmarksentry,
  exmformsfetch,
  marksheetfetch,
  exmformDisApprove,
  exmmarksApprove,
  TakeEnquiry,
  examFormFillup,
  exmformApprove,
  exmmarksDisApprove,
  amountFetch,
  FetchAllEnquiry,
  amountEdit,
  VerifyEnquiry,
  noticecreate,
  noticefetch,
  subjectAdd,
  ResetPassword,
  ChangePassword,
  SendResetLink,
  Coordinator_Update,
  Certi_fetch,
  Delete_Admin,
  All_Center,
  Fetch_Coordinator,
  updateEnquiry,
  Delete_Enrollment,
  deleteEnquiry,
  fetchAllCourse,
  updateCourse,
  updateEnrollment,
  fetchAllCourseWithSub,
  StudentData,
} from "../controller/mainController.js";
import { ErrorHandler } from "../errhandling.js";
import {
  adminAuthCheckFn,
  centerAuthCheckFn,
  otpLimiter,
  verifyInternalApiKey,
} from "../middleware.js";
import {
  loginFunc,
  loginCheckFunc,
  logoutfunc,
  signupFunc,
  studentLogin,
  generateSecret,
  otpVerify,
  otpInput,
} from "../controller/authController.js";
import { generate_franchise } from "../controller/generetor.js";

const router = Router();

// auth route
//test
router.route("/loginRoute").post(loginFunc);
router.route("/loginCheckRoute").get(loginCheckFunc); //max api rate limit hit korte pare
router.route("/logout").get(ErrorHandler(logoutfunc));
router.route("/studentLogin").post(ErrorHandler(studentLogin));

router.route("/studentData").get(ErrorHandler(StudentData));

//internal route

router.route("/signupRoute").post(verifyInternalApiKey, signupFunc);

//center route

router.route("/otpInput").post(ErrorHandler(otpInput));

router.route("/otpVerify").post(centerAuthCheckFn, ErrorHandler(otpVerify));

router
  .route("/generateSecret")
  .get(centerAuthCheckFn, ErrorHandler(generateSecret));
router
  .route("/Delete_Enrollment")
  .delete(centerAuthCheckFn, ErrorHandler(Delete_Enrollment));

router
  .route("/exmformfillupDatafetch")
  .post(centerAuthCheckFn, ErrorHandler(exmformfillupDatafetch));
router
  .route("/AllEnrollments")
  .get(centerAuthCheckFn, ErrorHandler(AllEnrollments));
router
  .route("/createEnrollment")
  .post(centerAuthCheckFn, ErrorHandler(createEnrollment));
router.route("/amountFetch").get(centerAuthCheckFn, ErrorHandler(amountFetch));
router.route("/amountEdit").post(centerAuthCheckFn, ErrorHandler(amountEdit));
router
  .route("/exmmarksentry")
  .post(centerAuthCheckFn, ErrorHandler(exmmarksentry));
router
  .route("/exmformsfetch")
  .get(centerAuthCheckFn, ErrorHandler(exmformsfetch));
router
  .route("/marksheetfetch")
  .get(centerAuthCheckFn, ErrorHandler(marksheetfetch));
router
  .route("/examFormFillup")
  .post(centerAuthCheckFn, ErrorHandler(examFormFillup));
router
  .route("/ChangePassword")
  .post(otpLimiter, centerAuthCheckFn, ErrorHandler(ChangePassword));
router
  .route("/Fetch_Coordinator")
  .get(centerAuthCheckFn, ErrorHandler(Fetch_Coordinator));

//public route
router.route("/TakeEnquiry").post(ErrorHandler(TakeEnquiry));
router.route("/ResetPassword").post(otpLimiter, ErrorHandler(ResetPassword));
router.route("/SendResetLink").post(otpLimiter, ErrorHandler(SendResetLink));
router.route("/Certi_fetch").post(ErrorHandler(Certi_fetch));
router.route("/noticefetch").get(ErrorHandler(noticefetch));
router.route("/fetchAllCourse").get(ErrorHandler(fetchAllCourse));

//admin route

router
  .route("/fetchAllCourseWithSub")
  .get(adminAuthCheckFn, ErrorHandler(fetchAllCourseWithSub));
router
  .route("/updateEnrollment")
  .put(adminAuthCheckFn, ErrorHandler(updateEnrollment));
router.route("/updateCourse").put(adminAuthCheckFn, ErrorHandler(updateCourse));

router
  .route("/createCourse")
  .post(adminAuthCheckFn, ErrorHandler(createCourse));
router
  .route("/generate_franchise")
  .post(adminAuthCheckFn, ErrorHandler(generate_franchise));
router
  .route("/FetchAllEnquiry")
  .get(adminAuthCheckFn, ErrorHandler(FetchAllEnquiry));
router
  .route("/Coordinator_Update")
  .post(adminAuthCheckFn, ErrorHandler(Coordinator_Update));
router
  .route("/VerifyEnquiry")
  .get(adminAuthCheckFn, ErrorHandler(VerifyEnquiry));
router
  .route("/exmformApprove")
  .post(adminAuthCheckFn, ErrorHandler(exmformApprove));
router
  .route("/exmformDisApprove")
  .post(adminAuthCheckFn, ErrorHandler(exmformDisApprove));
router
  .route("/exmmarksApprove")
  .post(adminAuthCheckFn, ErrorHandler(exmmarksApprove));
router
  .route("/exmmarksDisApprove")
  .post(adminAuthCheckFn, ErrorHandler(exmmarksDisApprove));
router
  .route("/generateCertificate")
  .post(adminAuthCheckFn, ErrorHandler(generateCertificate));
router
  .route("/generateadmit")
  .post(adminAuthCheckFn, ErrorHandler(generateadmit));
router
  .route("/generateMarksheet")
  .post(adminAuthCheckFn, ErrorHandler(generateMarksheet));
router.route("/generateId").post(adminAuthCheckFn, ErrorHandler(generateId));
router
  .route("/deActivateEnrollment")
  .post(adminAuthCheckFn, ErrorHandler(deActivateEnrollment));
router
  .route("/ActivateEnrollment")
  .post(adminAuthCheckFn, ErrorHandler(ActivateEnrollment));

router
  .route("/Delete_Admin")
  .delete(adminAuthCheckFn, ErrorHandler(Delete_Admin));
router
  .route("/noticecreate")
  .post(adminAuthCheckFn, ErrorHandler(noticecreate));

router.route("/All_Center").get(adminAuthCheckFn, ErrorHandler(All_Center));
router.route("/subjectAdd").post(adminAuthCheckFn, ErrorHandler(subjectAdd));
router
  .route("/updateEnquiry/:id")
  .post(adminAuthCheckFn, ErrorHandler(updateEnquiry));
router
  .route("/deleteEnquiry")
  .delete(adminAuthCheckFn, ErrorHandler(deleteEnquiry));

export default router;
