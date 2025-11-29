const SuccessScreen = ({ setAuthView }) => {
  return (
    <div className=" flex  justify-center p-4">
      <div className="bg-slate-800/60 backdrop-blur-md p-6 sm:p-8 rounded-2xl w-[380px] shadow-lg text-white ">
      <h2 className="text-2xl font-bold mb-4">Password Reset Successful 🎉</h2>
      <p className="mb-6 text-gray-300 text-sm sm:text-base">
        Your password has been updated successfully. You can now log in again.
      </p>
      <button
        onClick={() => setAuthView("authTabs")}
        className="w-full bg-blue-500 hover:bg-blue-600 transition-colors py-2.5 rounded-lg text-white font-medium"
      >
        Back to Login
      </button>
      </div>
    </div>

  )
    
};

export default SuccessScreen;
