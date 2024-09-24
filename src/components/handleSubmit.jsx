const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior
  
    // Extract email, password, and rememberMe from state
    const { email, password, rememberMe } = formState;
  
    try {
      // Sign in the user with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      toast.success("User logged in successfully", {
        position: "top-center",
      });
  
      // Fetch the user's role from Firestore
      const docRef = doc(db, "Users", user.uid);
      const docSnap = await getDoc(docRef);
  
      if (docSnap.exists()) {
        const userData = docSnap.data();
        const userRole = userData.role;
  
        // Redirect to either admin or user page based on the role
        if (userRole === "admin") {
          navigate("/admin");
        } else if (userRole === "user") {
          navigate("/user");
        } else {
          toast.error("Invalid role, please contact support", {
            position: "bottom-center",
          });
        }
      } else {
        toast.error("User data not found, please contact support", {
          position: "bottom-center",
        });
      }
  
      // Handle Remember Me functionality
      if (rememberMe) {
        localStorage.setItem('email', email);
        localStorage.setItem('password', password);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('email');
        localStorage.removeItem('password');
        localStorage.removeItem('rememberMe');
      }
  
    } catch (error) {
      console.error("Login error:", error);
  
      // Handle different Firebase authentication errors
      switch (error.code) {
        case "auth/user-not-found":
          toast.error("No account found with this email.", {
            position: "bottom-center",
          });
          break;
        case "auth/wrong-password":
          toast.error("Incorrect password. Please try again.", {
            position: "bottom-center",
          });
          break;
        case "auth/invalid-email":
          toast.error("Invalid email format.", {
            position: "bottom-center",
          });
          break;
        case "auth/too-many-requests":
          toast.error("Too many attempts. Please try again later.", {
            position: "bottom-center",
          });
          break;
        default:
          toast.error("Login failed. Please try again.", {
            position: "bottom-center",
          });
      }
    }
  };
  