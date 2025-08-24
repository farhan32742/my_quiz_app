import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import cookieParser from 'cookie-parser'; 

// --- DATABASE AND CRON JOB IMPORTS (CORRECTED) ---
// './' because 'config' is in the same directory as this file
import './config/db.js'; 
// '../' because we must go UP one level from 'server' to find the 'cron' folder
import { startStatusUpdater } from '../cron/quizStatusUpdater.js';

// --- ROUTE IMPORTS (CORRECTED) ---
// './' because 'routes' is in the same directory as this file
import authRoutes from './routes/authRoutes.js';
import examRoutes from './routes/examRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import studentDashboardRoutes from './routes/studentDashboardRoutes.js'; // Import student routes

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// --- MIDDLEWARE ---
app.set('view engine', 'ejs');
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser()); 
app.use('/api', authRoutes);
// --- HTML PAGE SERVING ROUTES ---
// (These are correct as is)
app.get('/', (req, res) => res.sendFile(path.resolve('public/frontpage.html')));
app.get('/login', (req, res) => res.sendFile(path.resolve('public/login.html')));
app.get('/signup', (req, res) => res.sendFile(path.resolve('public/signup.html')));
app.get('/studentDashboard', (req, res) => res.sendFile(path.resolve('public/studentDashboard.html')));
app.get('/teacherDashboard', (req, res) => res.sendFile(path.resolve('public/teacherDashboard.html')));
app.get('/adminDashboard', (req, res) => res.sendFile(path.resolve('public/adminDashboard.html')));
app.get('/createExam', (req, res) => res.sendFile(path.resolve('public/createExam.html')));
app.get('/addQuestions', (req, res) => res.sendFile(path.resolve('public/addQuestions.html')));

// --- API ROUTES ---
app.use('/api', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/student-dashboard', studentDashboardRoutes);

// --- START SERVER AND CRON JOB ---
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startStatusUpdater();
});