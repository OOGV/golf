// app.jsx — main app with screens, state, tweaks

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "screen": "round",
  "recordMode": "shots",
  "showTrail": true,
  "density": "regular"
}/*EDITMODE-END*/;

const { useState, useMemo } = React;

// ─── RoundHeader ─────────────────────────────────────────────
function RoundHeader({ round, course, onMenu }) {
  const { toPar, played } = totalToPar(round, course.holes);
  const par = round.scores.reduce((s, v, i) => s + (v != null ? course.holes[i].par : 0), 0);
  const strokes = round.scores.reduce((s, v) => s + (v || 0), 0);
  return (
    <div style={{
      padding: '14px 20px 16px',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    }}>
      <div>
        <div style={{
          fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase',
          color: 'rgba(26,38,32,0.5)', fontWeight: 500, marginBottom: 4,
        }}>Round · {round.startedAt.slice(11)} · {course.tees.find(t => t.id === round.teeId).label}</div>
        <div style={{
          fontSize: 22, fontWeight: 500, color: '#1A2620',
          letterSpacing: -0.4, fontFamily: 'Geist, ui-sans-serif',
        }}>{course.name}</div>
        <div style={{
          fontSize: 13, color: 'rgba(26,38,32,0.55)', marginTop: 2,
        }}>{played} of 18 played · {strokes} strokes</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <button onClick={onMenu} style={{
          width: 36, height: 36, borderRadius: 10, border: 0,
          background: 'rgba(26,38,32,0.06)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="12" viewBox="0 0 14 12">
            <path d="M0 1h14M0 6h14M0 11h14" stroke="#1A2620" strokeWidth="1.2"/>
          </svg>
        </button>
        <div style={{
          fontFamily: '"Geist Mono", ui-monospace, monospace',
          fontSize: 26, fontWeight: 500, lineHeight: 1,
          color: toPar < 0 ? '#3F5B47' : toPar === 0 ? '#1A2620' : '#A8584B',
          letterSpacing: -0.5,
        }}>{toPar === 0 ? 'E' : toPar > 0 ? `+${toPar}` : toPar}</div>
        <div style={{
          fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase',
          color: 'rgba(26,38,32,0.5)', fontWeight: 500,
        }}>to par</div>
      </div>
    </div>
  );
}

// ─── HoleHeader ──────────────────────────────────────────────
function HoleHeader({ hole, teeId }) {
  const meters = hole.m[teeId];
  return (
    <div style={{
      padding: '18px 20px 12px',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      borderTop: '1px solid rgba(26,38,32,0.08)',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <div style={{
          fontFamily: '"Geist Mono", ui-monospace, monospace',
          fontSize: 44, fontWeight: 500, color: '#1A2620',
          letterSpacing: -2, lineHeight: 1,
        }}>{String(hole.n).padStart(2, '0')}</div>
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 2,
          paddingBottom: 4,
        }}>
          <div style={{
            fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase',
            color: 'rgba(26,38,32,0.5)', fontWeight: 500,
          }}>Hole</div>
          <div style={{ fontSize: 13, color: 'rgba(26,38,32,0.7)' }}>
            Par {hole.par}
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{
          fontFamily: '"Geist Mono", ui-monospace, monospace',
          fontSize: 22, fontWeight: 500, color: '#1A2620',
          letterSpacing: -0.5, lineHeight: 1,
        }}>{meters}<span style={{
          fontSize: 11, color: 'rgba(26,38,32,0.5)', marginLeft: 2,
        }}>m</span></div>
        <div style={{
          fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase',
          color: 'rgba(26,38,32,0.5)', fontWeight: 500, marginTop: 4,
        }}>distance</div>
      </div>
    </div>
  );
}

// ─── ShootSheet — pick club, take the shot ───────────────────
// Distance is auto-calculated from GPS between this shoot tap and the next one.
// The flow: tap Shoot → pick club + lie → confirm Shoot.
// Outcome buttons (Holed / Out / Hazard / Lost) end the current shot without
// staging a new one.
function ShootSheet({ shotN, inFlight, onShoot, onMark, onClose }) {
  const [club, setClub] = useState(inFlight ? inFlight.club : '7i');
  const [ball, setBall] = useState('prov1');
  const [lie, setLie]   = useState(inFlight ? (inFlight.startLie || 'fairway') : 'fairway');

  return (
    <div style={{ padding: '0 22px' }}>
      {inFlight && (
        <div style={{
          background: 'rgba(26,38,32,0.04)',
          border: '1px dashed rgba(26,38,32,0.18)',
          borderRadius: 10,
          padding: '10px 12px',
          marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase',
              color: 'rgba(26,38,32,0.5)', fontWeight: 500,
            }}>Previous · shot {inFlight.n}</div>
            <div style={{
              fontSize: 13, color: '#1A2620', marginTop: 2,
              fontFamily: 'Geist, ui-sans-serif',
            }}>{CLUBS.find(c => c.id === inFlight.club)?.label || 'Shot'} in flight</div>
          </div>
          <div style={{
            fontSize: 10, color: 'rgba(26,38,32,0.55)',
            textAlign: 'right',
            lineHeight: 1.3,
          }}>Distance recorded<br/>when you shoot next</div>
        </div>
      )}

      <div style={{
        fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase',
        color: 'rgba(26,38,32,0.5)', fontWeight: 500, marginBottom: 10,
      }}>Club · shot {shotN}</div>
      <div style={{
        display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6,
        marginBottom: 14,
      }}>
        {CLUBS.map(c => (
          <button key={c.id} onClick={() => setClub(c.id)} style={{
            border: 0, cursor: 'pointer',
            background: club === c.id ? '#1A2620' : 'rgba(26,38,32,0.05)',
            color: club === c.id ? '#F2EFE8' : '#1A2620',
            padding: '10px 14px', borderRadius: 10,
            fontSize: 13, fontWeight: 500,
            whiteSpace: 'nowrap', flexShrink: 0,
            fontFamily: 'Geist, ui-sans-serif',
          }}>{c.label}<span style={{
              fontFamily: '"Geist Mono", ui-monospace, monospace',
              fontSize: 10, opacity: 0.55, marginLeft: 6,
            }}>{c.carry || '–'}m</span></button>
        ))}
      </div>

      <div style={{
        fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase',
        color: 'rgba(26,38,32,0.5)', fontWeight: 500, marginBottom: 10,
      }}>Ball · Lie</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <select value={ball} onChange={e => setBall(e.target.value)} style={{
          flex: 1, height: 44, borderRadius: 10,
          border: '1px solid rgba(26,38,32,0.15)',
          background: '#F2EFE8', color: '#1A2620',
          padding: '0 12px', fontSize: 14,
          fontFamily: 'Geist, ui-sans-serif',
          appearance: 'none',
        }}>
          {BALLS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
        </select>
        <select value={lie} onChange={e => setLie(e.target.value)} style={{
          flex: 1, height: 44, borderRadius: 10,
          border: '1px solid rgba(26,38,32,0.15)',
          background: '#F2EFE8', color: '#1A2620',
          padding: '0 12px', fontSize: 14,
          fontFamily: 'Geist, ui-sans-serif',
          appearance: 'none',
        }}>
          <option value="tee">Tee</option>
          <option value="fairway">Fairway</option>
          <option value="rough">Rough</option>
          <option value="bunker">Bunker</option>
          <option value="green">Green</option>
        </select>
      </div>

      {inFlight && (
        <React.Fragment>
          <div style={{
            fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase',
            color: 'rgba(26,38,32,0.5)', fontWeight: 500, marginBottom: 10,
          }}>End previous shot as…</div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
            marginBottom: 18,
          }}>
            {['holed', 'out', 'hazard', 'lost'].map(r => (
              <button key={r} onClick={() => onMark(r)} style={{
                border: '1px solid rgba(26,38,32,0.15)', cursor: 'pointer',
                background: 'transparent', color: '#1A2620',
                padding: '12px 0', borderRadius: 10,
                fontSize: 12, fontWeight: 500,
                textTransform: 'capitalize',
                fontFamily: 'Geist, ui-sans-serif',
              }}>{r}</button>
            ))}
          </div>
        </React.Fragment>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <PrimaryButton variant="outline" onClick={onClose} style={{ flex: 1 }}>
          Cancel
        </PrimaryButton>
        <PrimaryButton onClick={() => onShoot({ club, ball, lie })} style={{ flex: 2 }}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M2 6h7m-3-3l3 3-3 3" stroke="#F2EFE8" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Shoot
        </PrimaryButton>
      </div>
    </div>
  );
}

// ─── Stats card grid ─────────────────────────────────────────
function StatsGlance({ round, course }) {
  const played = round.scores.filter(s => s != null).length;
  const fwyHit = round.fairways.filter(f => f === true).length;
  const fwyEligible = round.fairways.filter((f, i) => f !== null && round.scores[i] != null).length;
  const girHit = round.gir.filter((g, i) => g === true && round.scores[i] != null).length;
  const totalPutts = round.putts.reduce((s, p) => s + (p || 0), 0);
  const avgPutts = played ? (totalPutts / played).toFixed(1) : '–';
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 12,
      padding: '12px 20px 4px',
    }}>
      <Stat label="Fairways" value={`${fwyHit}/${fwyEligible}`} />
      <Stat label="GIR" value={`${girHit}/${played}`} />
      <Stat label="Putts" value={totalPutts} />
      <Stat label="Avg" value={avgPutts} unit="ppr" />
    </div>
  );
}

// ─── RoundScreen ─────────────────────────────────────────────
function RoundScreen({ onMenu, onOpenSheet }) {
  const round = ROUND;
  const course = COURSE;
  const hole = course.holes[round.currentHole - 1];
  const shots = round.currentShots;

  return (
    <div style={{
      height: '100%', overflow: 'auto',
      background: '#F2EFE8',
      paddingTop: 54,
    }}>
      <RoundHeader round={round} course={course} onMenu={onMenu} />

      <div style={{ padding: '0 0 14px' }}>
        <HoleStrip holes={course.holes} round={round} />
      </div>

      <Hairline />

      <HoleHeader hole={hole} teeId={round.teeId} />

      <div style={{ padding: '0 16px 16px' }}>
        <HoleMap hole={hole} shots={shots} height={250} />
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          marginTop: 8, padding: '0 4px',
          fontFamily: '"Geist Mono", ui-monospace, monospace',
          fontSize: 11, color: 'rgba(26,38,32,0.55)',
        }}>
          <span>To pin · <strong style={{ color: '#1A2620', fontWeight: 500 }}>118 m</strong></span>
          <span>Wind · <strong style={{ color: '#1A2620', fontWeight: 500 }}>SW 13 km/h</strong></span>
        </div>
      </div>

      <Hairline />

      <div style={{ padding: '16px 20px 4px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{
          fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase',
          color: 'rgba(26,38,32,0.5)', fontWeight: 500,
        }}>This hole · {shots.length} shot{shots.length !== 1 ? 's' : ''}</div>
        {shots.length > 0 && (
          <ScoreBadge score={shots.length} par={hole.par} size={26} />
        )}
      </div>

      <div style={{ padding: '0 20px' }}>
        {shots.map(s => (
          <ShotRow key={s.n} shot={s}
            club={CLUBS.find(c => c.id === s.club)}
            ball={BALLS.find(b => b.id === s.ball)} />
        ))}
      </div>

      <div style={{ padding: '14px 20px 0', display: 'flex', gap: 8 }}>
        <PrimaryButton onClick={onOpenSheet} style={{ flex: 1 }}>
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M2 7h9m-3-4l4 4-4 4" stroke="#F2EFE8" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {shots.some(s => s.status === 'in_flight') ? `Shoot · shot ${shots.length + 1}` : `Shoot · shot ${shots.length + 1}`}
        </PrimaryButton>
      </div>
      <div style={{ padding: '8px 20px 0',
        fontSize: 11, color: 'rgba(26,38,32,0.5)', textAlign: 'center',
      }}>
        Tap to start the next shot. We measure the previous one automatically.
      </div>

      <Hairline style={{ margin: '20px 0 0' }} />

      <div style={{ padding: '4px 0 16px' }}>
        <div style={{
          fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase',
          color: 'rgba(26,38,32,0.5)', fontWeight: 500,
          padding: '14px 20px 0',
        }}>Round stats</div>
        <StatsGlance round={round} course={course} />
      </div>

      <div style={{ height: 56 }} />
    </div>
  );
}

// ─── CourseScreen ────────────────────────────────────────────
function CourseScreen({ onPick }) {
  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#F2EFE8', paddingTop: 54 }}>
      <div style={{ padding: '16px 20px 8px' }}>
        <div style={{
          fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase',
          color: 'rgba(26,38,32,0.5)', fontWeight: 500, marginBottom: 6,
        }}>Start a round</div>
        <div style={{
          fontSize: 28, fontWeight: 500, letterSpacing: -0.6, color: '#1A2620',
        }}>Choose course</div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {COURSES.map((c, i) => (
          <button key={c.id} onClick={() => onPick(c.id)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 12px',
            borderTop: i === 0 ? '1px solid rgba(26,38,32,0.1)' : 'none',
            borderBottom: '1px solid rgba(26,38,32,0.1)',
            background: 'transparent', border: 0,
            borderTopWidth: i === 0 ? 1 : 0, borderTopStyle: 'solid', borderTopColor: 'rgba(26,38,32,0.1)',
            cursor: 'pointer', width: '100%', textAlign: 'left',
          }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 500, color: '#1A2620', letterSpacing: -0.2 }}>
                {c.name}
              </div>
              <div style={{
                fontSize: 12, color: 'rgba(26,38,32,0.55)', marginTop: 2,
                fontFamily: '"Geist Mono", ui-monospace, monospace',
              }}>{c.region} · {c.distance} · par {c.par}</div>
            </div>
            <svg width="8" height="14" viewBox="0 0 8 14">
              <path d="M1 1l6 6-6 6" stroke="rgba(26,38,32,0.4)" strokeWidth="1.2" fill="none"/>
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── TeeScreen ───────────────────────────────────────────────
function TeeScreen({ courseId, onPick, onBack }) {
  const course = COURSES.find(c => c.id === courseId) || COURSE;
  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#F2EFE8', paddingTop: 54 }}>
      <div style={{ padding: '16px 20px 8px' }}>
        <button onClick={onBack} style={{
          border: 0, background: 'transparent', padding: 0, cursor: 'pointer',
          fontSize: 13, color: 'rgba(26,38,32,0.55)',
          display: 'flex', alignItems: 'center', gap: 4,
          marginBottom: 12,
        }}>
          <svg width="6" height="11" viewBox="0 0 6 11">
            <path d="M5 1L1 5.5 5 10" stroke="currentColor" strokeWidth="1.3" fill="none"/>
          </svg>
          Courses
        </button>
        <div style={{
          fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase',
          color: 'rgba(26,38,32,0.5)', fontWeight: 500, marginBottom: 6,
        }}>{course.name}</div>
        <div style={{
          fontSize: 28, fontWeight: 500, letterSpacing: -0.6, color: '#1A2620',
        }}>Choose tee</div>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {COURSE.tees.map(t => (
          <button key={t.id} onClick={() => onPick(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '18px 18px',
            background: '#FFFFFF', border: '1px solid rgba(26,38,32,0.08)',
            borderRadius: 14, cursor: 'pointer', textAlign: 'left',
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: t.color, border: '1px solid rgba(26,38,32,0.2)',
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#1A2620' }}>
                {t.label}
              </div>
              <div style={{
                fontSize: 12, color: 'rgba(26,38,32,0.55)',
                fontFamily: '"Geist Mono", ui-monospace, monospace',
                marginTop: 2,
              }}>{t.total} yd · CR {COURSE.rating} · SR {COURSE.slope}</div>
            </div>
            <svg width="8" height="14" viewBox="0 0 8 14">
              <path d="M1 1l6 6-6 6" stroke="rgba(26,38,32,0.4)" strokeWidth="1.2" fill="none"/>
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Menu Drawer ─────────────────────────────────────────────
function MenuDrawer({ open, onClose, onNav }) {
  if (!open) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 200 }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(26,38,32,0.4)',
      }} />
      <div style={{
        position: 'absolute', top: 0, bottom: 0, right: 0,
        width: '78%',
        background: '#F2EFE8',
        boxShadow: '-20px 0 40px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column',
        paddingTop: 64,
      }}>
        <div style={{ padding: '20px 24px 8px' }}>
          <div style={{
            fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase',
            color: 'rgba(26,38,32,0.5)', fontWeight: 500, marginBottom: 4,
          }}>Linnea Holm</div>
          <div style={{
            fontSize: 26, fontWeight: 500, letterSpacing: -0.5,
            color: '#1A2620',
          }}>HCP 14.6</div>
        </div>

        <div style={{ padding: '20px 0', flex: 1, overflow: 'auto' }}>
          <MenuItem label="Round in progress" badge="Hole 7" onClick={() => onNav('round')} active />
          <MenuItem label="Courses" onClick={() => onNav('course')} />
          <Hairline style={{ margin: '12px 24px' }} />
          <div style={{
            fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase',
            color: 'rgba(26,38,32,0.5)', fontWeight: 500,
            padding: '6px 24px 10px',
          }}>History</div>
          {HISTORY.map((r, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 24px',
              borderBottom: '1px solid rgba(26,38,32,0.06)',
            }}>
              <div>
                <div style={{ fontSize: 14, color: '#1A2620', fontWeight: 500 }}>
                  {r.course}
                </div>
                <div style={{
                  fontSize: 11, color: 'rgba(26,38,32,0.5)', marginTop: 2,
                  fontFamily: '"Geist Mono", ui-monospace, monospace',
                }}>{r.date} · {r.tee} · {r.fwy} fwy · {r.gir} gir</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontFamily: '"Geist Mono", ui-monospace, monospace',
                  fontSize: 17, fontWeight: 500, color: '#1A2620',
                }}>{r.score}</div>
                <div style={{
                  fontSize: 10, fontFamily: '"Geist Mono", ui-monospace, monospace',
                  color: r.toPar.startsWith('+') ? '#A8584B' : '#3F5B47',
                }}>{r.toPar}</div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={onClose} style={{
          position: 'absolute', top: 58, right: 18,
          width: 36, height: 36, borderRadius: 10, border: 0,
          background: 'rgba(26,38,32,0.06)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M1 1l10 10M11 1L1 11" stroke="#1A2620" strokeWidth="1.3"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

function MenuItem({ label, badge, onClick, active }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      width: '100%', padding: '14px 24px',
      border: 0, background: active ? 'rgba(26,38,32,0.05)' : 'transparent',
      cursor: 'pointer', textAlign: 'left',
    }}>
      <span style={{
        fontSize: 16, color: '#1A2620', fontWeight: 500,
      }}>{label}</span>
      {badge && (
        <span style={{
          fontSize: 11, fontFamily: '"Geist Mono", ui-monospace, monospace',
          color: 'rgba(26,38,32,0.6)',
          padding: '4px 8px', borderRadius: 6,
          background: 'rgba(26,38,32,0.06)',
        }}>{badge}</span>
      )}
    </button>
  );
}

// ─── App ─────────────────────────────────────────────────────
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = useState(t.screen);
  const [courseId, setCourseId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  React.useEffect(() => { setScreen(t.screen); }, [t.screen]);

  const goto = (s) => { setScreen(s); setTweak('screen', s); setMenuOpen(false); };

  let body = null;
  if (screen === 'course') {
    body = <CourseScreen onPick={(id) => { setCourseId(id); goto('tee'); }} />;
  } else if (screen === 'tee') {
    body = <TeeScreen courseId={courseId} onPick={() => goto('round')} onBack={() => goto('course')} />;
  } else {
    body = <RoundScreen onMenu={() => setMenuOpen(true)} onOpenSheet={() => setSheetOpen(true)} onFinishHole={() => {}} />;
  }

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#E6E1D5',
      fontFamily: 'Geist, ui-sans-serif',
    }}>
      <IOSDevice width={402} height={874}>
        <div style={{ position: 'relative', height: '100%', background: '#F2EFE8' }}>
          {body}
          <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} onNav={goto} />
          <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)}
            title={`Shoot · hole ${ROUND.currentHole}`}>
            <ShootSheet
              shotN={ROUND.currentShots.length + 1}
              inFlight={ROUND.currentShots.find(s => s.status === 'in_flight')}
              onShoot={() => setSheetOpen(false)}
              onMark={() => setSheetOpen(false)}
              onClose={() => setSheetOpen(false)} />
          </Sheet>
        </div>
      </IOSDevice>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Screen" />
        <TweakRadio label="View" value={t.screen}
          options={['course', 'tee', 'round']}
          onChange={(v) => setTweak('screen', v)} />
        <TweakSection label="Round display" />
        <TweakRadio label="Record mode" value={t.recordMode}
          options={['shots', 'hole total']}
          onChange={(v) => setTweak('recordMode', v)} />
        <TweakToggle label="Show shot trail" value={t.showTrail}
          onChange={(v) => setTweak('showTrail', v)} />
        <TweakRadio label="Density" value={t.density}
          options={['compact', 'regular']}
          onChange={(v) => setTweak('density', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
