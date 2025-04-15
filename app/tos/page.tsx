"use client";

import Image from "next/image";
import Link from 'next/link'
import '../globals.css'
import { AppProps } from 'next/app'
import { useState } from 'react'
import { useEffect } from 'react'

export default function Home() {
  return (
      <div className="text-center text-white text-xl flex outline justify-center">
        <div className="w-[80%] max-w-[900px] text-left">
          <br/><br/>
          <div className="font-bold text-5xl text-center">Terms of Service</div>

          <div className="font-bold text-center"><br></br>Located in Vaughan, Ontario Canada<br/>
          Shipping within Canada only<br/><br/></div>

          <br/><div className="font-bold text-3xl text-[#cb18db]">Geckos</div>
          <div className="italic font-bold pt-[10px]">Updated June 1st 2024<br/><br/></div>
          <div className="w-[100%] bg-white h-[1px]"></div><br/>

          When purchasing a gecko from Vintage Reptiles you are acknowledging that you have read, understood and agree to the TOS. The TOS is in place to protect potential buyers and myself. Vintage Reptiles reserves the right to refuse service to anyone.
          <br/><br/>

          <div className="font-bold text-2xl pb-[10px]">Payment Plans<br/></div>

          When purchasing a gecko a 35% non-refundable deposit will be used to hold your gecko<br/>
          Geckos $150 and under must be paid in full<br/>
          30-60 day payment plans are available upon request<br/>
          When the gecko has been paid in full it can be picked up/shipped out to the buyer. Payments can be made in the form of e-transfer or cash.<br/><br/>

          In the event the buyer fails to provide full payment on a gecko by the end of the agreed upon date or fails to keep in regular communication regarding the plan, no refunds will be given and the gecko will be taken off hold. Reminders will be sent but if there is no response then you lose your gecko and funds.
          <br/><br/>
          All sales are final.<br/>
          No returns, refunds or hold transfers.<br/><br/>


          <div className="font-bold text-2xl pb-[10px]">Pickup/Shipping<br/></div>

          Shipping is available at the buyer’s expense through Reptile Express. Quotes can be arranged upon request.<br/>
          Shipping is only available throughout Canada at this time.<br/>
          Once the geckos are paid in full, arrangements for either pickup or shipping can be made as soon as possible.<br/>
          Free summer and winter holds are available until the weather is deemed safe for shipping.<br/>
          Pickup is available in Vaughan or occasionally at reptile expos.<br/>
          Hatchlings will not be shipped until 5 grams, hatchlings cannot be picked up until 3 grams.<br/><br/>


          <div className="font-bold text-2xl pb-[10px]">Tail Drops/Nips/Shedding Damage<br/></div>

          Tail drops during shipping or holds occasionally happen as shipping can be very stressful on some geckos.<br/>
          Nips are unlikely to happen as I keep all my geckos separate unless pairing.<br/>
          Tip of the tail/toe loss can happen if the gecko does not shed properly.<br/>
          These events are out of my control and they do not affect the quality of life or value of the gecko. A refund will not be issued in the event of this occurring.
          <br/><br/>

          <div className="font-bold text-2xl pb-[10px]">Babies/Juveniles<br/></div>

          If a gecko is listed as unsexed or possible male/female it means the gecko is still too small to accurately sex and what is listed is what I’ve seen at the time of looking.
          <br/>Geckos that say male or female are big enough to be properly sexed and the gender is guaranteed.<br/><br/>


          <div className="font-bold text-2xl pb-[10px]">Health Guarantee:<br/></div>

          Vintage Reptiles offers a 5 day health guarantee. This guarantee is only effective if the buyer sends proof of safe arrival within the first 30 minutes of receiving the gecko(s).
          <br/>If there is no communication from the buyer in the first 30 minutes the health guarantee is VOID.<br/>
          The Health Guarantee is valid for DOA’s or sickness/death in the first 3 days after the gecko is received.<br/>
          I am not responsible for any injuries in your care and a refund will not be issued.
          <br/>In the event of a death within the first 5 days where it is deemed the receiver is not at fault, a credit of the same value towards another gecko is available excluding the shipping cost.
          <br/>DOA’s caused by delayed shipping will not be credited as that is out of my control, I do my best to package the geckos properly to avoid shipping problems but unfortunately I cannot prevent what happens with the chosen shipping company.
          <br/><br/>

          <div className="font-bold text-2xl pb-[10px]">Winter/Summer Holds<br/></div>

          I offer free winter/summer holds.<br/>
          Summer holds go into effect when the weather is too hot for a gecko to be safely shipped.<br/>
          Winter holds go into effect when the weather is too cold for the gecko to be safely shipped.<br/>
          If any health issues/tail drops arise while your gecko is on hold you will be notified ASAP.<br/>

          


          <br/><br/>
          <div className="font-bold text-3xl text-[#cb18db]">Plants</div>
          <div className="italic font-bold pt-[10px]">Updated June 1st 2024<br/><br/></div>
          <div className="w-[100%] bg-white h-[1px]"></div><br/>

          <div className="font-bold text-2xl pb-[10px]">Deposit/Payment Options</div>

          A plant must be paid in full to be put on hold. Plants can be picked up/shipped after the full cost of the plant has been received. Payments can be made in the form of e-transfer or cash. All payments made will not be refunded unless there are issues with the plant before pickup.
          <br></br>Inquiring about a plant without sending a deposit does not mean the plant has been claimed.

          <br></br><br></br>

          <div className="font-bold text-2xl pb-[10px]">Pickup/Shipping</div>

          Pickups are welcome in Vaughan or occasionally at Reptile Expos.
          <br></br>I also offer porch pickup to accommodate busy schedules.
          <br></br>Shipping is available at the buyer&apos;s risk and expense.
          <br></br>I offer flat rate $25 shipping across Canada.
          <br></br>Free shipping on orders over $225 CAD!<br></br><br></br>

          <div className="font-bold text-2xl pb-[10px]">Important Note</div>

          I use beneficial bugs as a pest prevention (Swirskii Ulti-mite) which could still be on the plants when they leave my care.
          <br></br>I do not offer refunds, returns, replacements or exchanges unless something happens to the plant while still in my care.


          <br></br><br></br><br></br>
        </div>
      </div>
  );
}
