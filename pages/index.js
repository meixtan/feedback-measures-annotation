import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { Inter } from "next/font/google";
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { db } from './api/firebase';

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [email, setEmail] = useState('');
  const [access, setAccess] = useState('');
  
  const router = useRouter();
  const [error, setError] = useState('');

  const saveUser = async() => {
    const colRef = collection(db, 'feedbackEval');
    const q = query(colRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      // No matching documents, create a new document
      const docRef = await addDoc(colRef, {
        email: email,
        accessCode: access,
        loginTime: serverTimestamp(), // Use serverTimestamp to record the current time
      });
      console.log('Document created with ID: ', docRef.id);
      return { tid: docRef.id, consented: false };
    } else {
      // Document exists, get the first matching document
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      console.log('Document data: ', data);
      return { tid: doc.id };
    }
  }

  const handleStartEditing = async () => {
    if (email == "" || access == "") {
      setError("All fields are required to log in.")
    } else {
      const user = await saveUser()
      console.log('at login')
      console.log(access)
      router.push({
        pathname: '/essays',
        query: { tid: user.tid, access: access },
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white font-sans font-light text-sm">
      <div className='grid grid-col w-2/5'>
      <div className="flex justify-center mb-4"> {/* Center the image */}
      <div className="w-full max-w-xs"> {/* Adjust max-width as needed */}
        <Image
          src={"/stanford-gse.png"}
          layout="responsive"
          width={4}
          height={3}
          className="max-w-full h-auto"
          alt="Stanford Graduate School of Education Logo"
        />
      </div>
    </div>
      <h1 className='text-3xl mb-4 p-4 text-gray-900 text-center'>Feedback Evaluation</h1>
      
      <p className="mb-4 text-gray-700 text-left">Thank you for participating in our study! We are researching how ELA teachers (and language models like ChatGPT) give feedback on students' essays, and we're grateful for your support. :)</p>
      <p className="mb-4 text-gray-700 text-left">Please enter your unique access code (from your welcome email):</p>
       
        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 p-2 border rounded text-gray-900 focus:border-[#006B81] outline-none"
        />
        <input
          type="text"
          placeholder="Access Code"
          value={access}
          onChange={(e) => setAccess(e.target.value)}
          className="mb-4 p-2 border rounded text-gray-900 focus:border-[#006B81] outline-none"
        />
        <button onClick={handleStartEditing} className="mt-2 bg-[#006B81] text-white p-2 rounded text-base">
          Get Started
        </button>
        <p className="mb-4 mt-2 text-[#C74632] text-left">{error}</p> 
        <p className="mb-4 mt-4 text-gray-400 text-left">If at any point you have questions, please email us at mxtan@stanford.edu.</p>   
        
      </div>
      
    </div>
  );
}
