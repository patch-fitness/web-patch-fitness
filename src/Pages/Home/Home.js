import AuthForm from '@/components/AuthForm/AuthForm'


const Home = () => {
  return (
    <div className = 'w-full h-[100vh]'>
        <div className = 'border-2 border-slate-800 bg-slate-800 text-white p-5 font-semibold text-xl'>
           Welcome to Gym Management System
        </div>
        <div
            className='w-full h-[100vh] bg-cover bg-center bg-no-repeat bg-[url("https://png.pngtree.com/thumb_back/fh260/background/20230719/pngtree-designing-your-own-home-gym-a-stunning-3d-image-image_3709968.jpg")]'
        >
          <AuthForm/>
        </div>

    </div>
  )
}

export default Home
