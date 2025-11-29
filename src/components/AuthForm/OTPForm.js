const OTPForm = ({ setAuthView }) => {
  return (
    <div className="min-h-full gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass-effect rounded-2xl p-8 shadow-2xl">
      <h2 className="text-2xl font-bold text-center mb-5 color-white">Enter OTP</h2>
      <input
        type="text"
        placeholder="Enter 6-digit OTP"
        className="w-full mb-4 p-2 rounded bg-transparent border border-slate-500 text-white placeholder-gray-400"
      />
      <button
        onClick={() => setAuthView("success")}
        className="w-full bg-green-500 hover:bg-green-600 transition-all py-2 rounded text-white font-semibold"
      >
        Verify OTP
      </button>
      <p
        onClick={() => setAuthView("forgot")}
        className="text-center mt-4 text-sm text-gray-300 cursor-pointer hover:underline"
      >
        Resend OTP
      </p>
        </div>
      </div>
    </div>
  );
};

export default OTPForm;
