import Image from "next/image"
import Link from "next/link"

export default function Galery(){
    return (
        <>
            <h1 className="text-3xl text-center font-bold mt-[10vh]">Ligas</h1>
            <div className="flex items-center justify-center w-[100%] h-[auto] mt-[2vh] flex-wrap">
                <Link href="/liga/nba" className="flex items-center justify-center bg-primary w-[42.5vw] h-[52.5vh] rounded-xl mr-8 overflow-hidden hover:scale-105 transition-transform duration-300 cursor-pointer">
                    <Image src="/images/LigasImages/nba.jpeg" alt="NBA" width={800} height={600} className="w-[100%] h-[100%] object-cover"/>
                </Link>
                <Link href="/liga/mls" className="flex items-center justify-center w-[42.5vw] h-[52.5vh] rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 cursor-pointer">
                    <Image src="/images/LigasImages/mls.jpeg" alt="MLS" width={800} height={600} className="w-[100%] h-[100%] object-cover"/>
                </Link>
                <Link href="/liga/nhl" className="flex items-center justify-center bg-primary w-[42.5vw] h-[52.5vh] rounded-xl mr-8 mt-8 overflow-hidden hover:scale-105 transition-transform duration-300 cursor-pointer">
                    <Image src="/images/LigasImages/nhl.jpeg" alt="NHL" width={800} height={600} className="w-[100%] h-[100%] object-cover"/>
                </Link>
                <Link href="/liga/nfl" className="flex items-center justify-center bg-primary w-[42.5vw] h-[52.5vh] rounded-xl mt-8 overflow-hidden hover:scale-105 transition-transform duration-300 cursor-pointer">
                    <Image src="/images/LigasImages/nfl.jpeg" alt="NFL" width={800} height={600} className="w-[100%] h-[100%] object-cover"/>
                </Link>
            </div>
        </>
    )
}