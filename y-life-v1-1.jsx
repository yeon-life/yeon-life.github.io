import React, { useState } from 'react';

export default function YLifeHomepageV11() {
  const [selectedTab, setSelectedTab] = useState('platform');

  const features = [
    {
      icon: '📚',
      title: '당신의 지식이 자산이 됩니다',
      desc: 'y-life.kr에서 만든 모든 콘텐츠(글, 메모, 토론)는 당신 것입니다. 언제든 내 페이지로 옮겨갈 수 있습니다.'
    },
    {
      icon: '🏗️',
      title: '나만의 브랜드 페이지를 만들어요',
      desc: '사이트 빌더로 교육기관, 개인 블로그, 소상공인 페이지를 쉽게 구축하세요. 복잡한 코딩 없이도 전문적으로.'
    },
    {
      icon: '✨',
      title: '나에게 딱 맞는 뉴스만 보여줍니다',
      desc: '나이, 지역, 관심거리에 따라 자동으로 필터링된 뉴스를 받아보세요. 따뜻한 말로 전하는 우리 지역 소식.'
    }
  ];

  const tenants = [
    {
      name: '연학원',
      domain: 'yeonplanning.com',
      desc: '학생 플래너와 학부모 소통 플랫폼',
      icon: '🎓'
    },
    {
      name: 'A학원 (부산)',
      domain: 'a-academy.kr',
      desc: '학원만의 독립적인 브랜드 페이지',
      icon: '📖'
    },
    {
      name: '개인 블로거',
      domain: 'myblog.kr',
      desc: '나의 콘텐츠, 나의 플랫폼',
      icon: '✍️'
    }
  ];

  return (
    <div style={{ fontFamily: "'Pretendard', sans-serif", backgroundColor: '#F0F4F5', color: '#2C3E42' }}>
      {/* ===== 헤더 ===== */}
      <header style={{
        backgroundColor: '#FFF',
        borderBottom: '1px solid #D4E0E3',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#5A7A82' }}>
            💫 y-life.kr
          </div>
          <nav style={{ display: 'flex', gap: '32px' }}>
            {['플랫폼', '사이트 빌더', '뉴스', '문서'].map(item => (
              <a key={item} href="#" style={{ textDecoration: 'none', color: '#5A7A82', fontSize: '15px', fontWeight: 500 }}>
                {item}
              </a>
            ))}
          </nav>
          <button style={{
            backgroundColor: '#5A7A82',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontWeight: 500,
            cursor: 'pointer'
          }}>
            시작하기
          </button>
        </div>
      </header>

      {/* ===== 히어로 섹션 ===== */}
      <section style={{
        backgroundColor: '#F0F4F5',
        padding: '80px 24px',
        textAlign: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 style={{ fontSize: '48px', fontWeight: 700, marginBottom: '16px', color: '#2C3E42' }}>
          당신의 지식을 당신의 것으로
        </h1>
        <p style={{ fontSize: '18px', color: '#6B8A90', marginBottom: '32px', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto 32px' }}>
          y-life.kr은 단순한 포털이 아닙니다.<br/>
          모든 시민, 학생, 교육자가 만드는 지식의 결과물을<br/>
          자신의 독립적인 플랫폼으로 가져갈 수 있는 공간입니다.
        </p>
        <button style={{
          backgroundColor: '#5A7A82',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '14px 32px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: 'pointer'
        }}>
          플랫폼 둘러보기
        </button>
      </section>

      {/* ===== 핵심 기능 3가지 ===== */}
      <section style={{ padding: '80px 24px', backgroundColor: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 700, textAlign: 'center', marginBottom: '64px', color: '#2C3E42' }}>
            y-life.kr의 세 가지 핵심
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px'
          }}>
            {features.map((feature, i) => (
              <div key={i} style={{
                backgroundColor: '#F0F4F5',
                borderRadius: '12px',
                padding: '32px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>{feature.icon}</div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: '#2C3E42' }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: '14px', color: '#6B8A90', lineHeight: 1.6 }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 뉴스 섹션 라이브 데모 ===== */}
      <section style={{ padding: '80px 24px', backgroundColor: '#F0F4F5' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '16px', color: '#2C3E42' }}>
            개인화 뉴스 시스템
          </h2>
          <p style={{ fontSize: '15px', color: '#6B8A90', marginBottom: '48px' }}>
            당신의 나이, 관심지역, 거리에 따라 자동으로 맞춤화된 뉴스를 받아보세요.
          </p>

          {/* 뉴스 설정 */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px',
            border: '1px solid #D4E0E3'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#2C3E42' }}>
              당신의 프로필
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#6B8A90', display: 'block', marginBottom: '8px' }}>
                  나이: 28세
                </label>
                <input type="range" min="10" max="70" defaultValue="28" style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6B8A90', display: 'block', marginBottom: '8px' }}>
                  관심지역
                </label>
                <select style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #D4E0E3' }}>
                  <option>중구</option>
                  <option>남구</option>
                  <option>동구</option>
                  <option>북구</option>
                  <option>울주군</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#6B8A90', display: 'block', marginBottom: '8px' }}>
                  거리범위
                </label>
                <select style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #D4E0E3' }}>
                  <option>1km 이내</option>
                  <option>5km 이내</option>
                  <option>전체</option>
                </select>
              </div>
            </div>
          </div>

          {/* 추천 뉴스 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {[
              { title: '2026년 울산시 교육 정책 발표', dept: '울산교육청', views: 1240, score: '9.2점' },
              { title: '중구청, 청년 창업 지원 확대', dept: '중구청', views: 892, score: '8.7점' },
              { title: '울산시 경제 정책 발표', dept: '경제산업실', views: 654, score: '8.1점' }
            ].map((news, i) => (
              <div key={i} style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid #D4E0E3',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#5A7A82';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#D4E0E3';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#2C3E42' }}>
                  {news.title}
                </h4>
                <p style={{ fontSize: '12px', color: '#6B8A90', marginBottom: '8px' }}>
                  {news.dept}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#A8B5B8' }}>
                    조회 {news.views}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#5A7A82',
                    backgroundColor: '#D4E0E3',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    {news.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 테넌트 사례 ===== */}
      <section style={{ padding: '80px 24px', backgroundColor: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '16px', color: '#2C3E42' }}>
            y-life.kr을 사용하는 곳들
          </h2>
          <p style={{ fontSize: '15px', color: '#6B8A90', marginBottom: '48px' }}>
            교육기관부터 개인 블로거까지, 누구나 자신의 브랜드 페이지를 만들 수 있습니다.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {tenants.map((tenant, i) => (
              <div key={i} style={{
                backgroundColor: '#F0F4F5',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid #D4E0E3'
              }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>{tenant.icon}</div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px', color: '#2C3E42' }}>
                  {tenant.name}
                </h3>
                <p style={{ fontSize: '13px', color: '#5A7A82', marginBottom: '12px', fontWeight: 500 }}>
                  {tenant.domain}
                </p>
                <p style={{ fontSize: '14px', color: '#6B8A90', lineHeight: 1.6 }}>
                  {tenant.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA 섹션 ===== */}
      <section style={{
        backgroundColor: '#5A7A82',
        padding: '80px 24px',
        textAlign: 'center',
        color: 'white'
      }}>
        <h2 style={{ fontSize: '40px', fontWeight: 700, marginBottom: '16px' }}>
          지금 시작하세요
        </h2>
        <p style={{ fontSize: '16px', marginBottom: '32px', opacity: 0.95 }}>
          당신의 지식을 당신의 자산으로 만드는 여정을 시작하세요.
        </p>
        <button style={{
          backgroundColor: 'white',
          color: '#5A7A82',
          border: 'none',
          borderRadius: '8px',
          padding: '14px 32px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: 'pointer'
        }}>
          가입하기
        </button>
      </section>

      {/* ===== 푸터 ===== */}
      <footer style={{
        backgroundColor: '#2C3E42',
        color: 'white',
        padding: '48px 24px',
        textAlign: 'center',
        fontSize: '13px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{ marginBottom: '12px' }}>© 2026 y-life.kr. 모든 권리 보유.</p>
          <p style={{ opacity: 0.7 }}>
            당신의 지식이 당신의 자산이 되는 오픈 지식 생산 플랫폼
          </p>
        </div>
      </footer>
    </div>
  );
}