# Mess Management Admin Dashboard

A comprehensive admin dashboard for managing mess operations, including real-time attendance tracking, complaint management, and ratings monitoring.

## Features

- **Real-time Attendance Tracking** - Monitor user attendance with live Firebase listeners
- **Complaint Management** - View, track, and manage user complaints efficiently
- **Ratings Dashboard** - Access and analyze user feedback and ratings
- **Secure Authentication** - Google OAuth integration with Firebase admin role-based access

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A Firebase project with Firestore enabled
- Admin access to the Firebase project

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mess-admin-dashboard.git
cd mess-admin-dashboard
```

2. Install dependencies:
```bash
npm install
```

## Configuration

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Google Authentication in the Firebase Console
3. Set up Firestore database
4. Add your account as a Firebase admin in the project settings
5. Create a `.env.local` file in the root directory and add your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Admin Access

**Important:** Only accounts designated as Firebase admins can access this dashboard. Ensure your Google account is configured with admin privileges in your Firebase project.

## Usage

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port specified by your dev server).

## Tech Stack

- **Frontend Framework:** React / Vue / Angular (specify your framework)
- **Backend:** Firebase (Firestore, Authentication)
- **Authentication:** Google OAuth via Firebase
- **Real-time Database:** Cloud Firestore with live listeners
- **Build Tool:** Vite


## Key Functionalities

### 1. Attendance Management
- Real-time attendance monitoring using Firestore listeners
- View current meal attendance
- Historical attendance data and analytics

### 2. Complaint System
- View all user complaints
- Filter and sort complaints by status, date, or category
- Update complaint status and add admin responses
- Track complaint resolution metrics

### 3. Ratings & Feedback
- Monitor user ratings for meals and services
- View aggregated rating statistics
- Analyze feedback trends over time

## Security

- Firebase Security Rules ensure only admin users can access sensitive data
- Google OAuth provides secure authentication
- Role-based access control (RBAC) implemented at the database level

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues, questions, or suggestions, please open an issue in the GitHub repository.

## Acknowledgments

- Firebase for backend infrastructure


---

**Note:** This is an administrative tool. Ensure you have proper authorization before accessing or modifying any data.