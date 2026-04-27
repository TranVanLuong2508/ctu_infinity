'use client';

import CountUp from 'react-countup';

export default function AnimatedNumber({ value }: { value: number }) {
  return (
    <CountUp
      start={0}
      end={value}
      duration={1}
      separator=","
      formattingFn={(val) => val.toLocaleString('vi-VN')}
    />
  );
}
