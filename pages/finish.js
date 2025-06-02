// components/options.js
import Image from 'next/image';
import { useRouter } from 'next/router';

export default function Finish() {
  const router = useRouter();
  const { tid } = router.query;

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
          
          <p className="mb-4 text-gray-700 text-left">You're all done for now! Please email mxtan@stanford.edu to let us know so we can process your gift card. Thank you for participating in our study!</p>
          </div>
          
        </div>
  );
};
