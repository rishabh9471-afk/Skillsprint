import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from './lib/api.js';
import { load, save, remove, KEYS, uuid, storageOk } from './lib/storage.js';
import { track, setTrackingVisitor } from './lib/track.js';
import { scenarioById } from './shared/scenarios.js';
import { useOnline } from './lib/hooks.js';
import TopBar from './components/TopBar.jsx';
import Onboarding from './components/Onboarding.jsx';
import Home from './components/Home.jsx';
import Writer from './components/Writer.jsx';
import Feedback from './components/Feedback.jsx';
import Interview from './components/Interview.jsx';
import Verdict from './components/Verdict.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import ProfileSheet from './components/ProfileSheet.jsx';
import Modal from './components/Modal.jsx';
import { Banner } from './components/ui.jsx';

/* The in-progress session, saved in the browser after every change:
 * { sessionId, scenarioId, step: 'write'|'feedback'|'interview'|'verdict',
 *   draft, versions: [{ answer, result }], replies: [str, str], skipped: [bool, bool],
 *   fuIndex, verdict, notAnswer } */

const emptyProgress = { completed: {}, totalXp: 0 };

function restoreActive(a) {
  if (!a || !scenarioById[a.scenarioId]) return null;
  return { replies: ['', ''], skipped: [false, false], fuIndex: 0, versions: [], draft: '', ...a };
}

export default function App() {
  const [visitor, setVisitor] = useState(() => load(KEYS.visitor));
  const [progress, setProgress] = useState(() => load(KEYS.progress, emptyProgress));
  const [active, setActive] = useState(() => restoreActive(load(KEYS.active)));
  const [status, setStatus] = useState(null);
  const [view, setView] = useState(() => (restoreActive(load(KEYS.active)) ? 'session' : 'home')); // home | session | leaderboard
  const [profileOpen, setProfileOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const online = useOnline();

  // Persist everything the user would hate to lose.
  useEffect(() => (visitor ? save(KEYS.visitor, visitor) : remove(KEYS.visitor)), [visitor]);
  useEffect(() => save(KEYS.progress, progress), [progress]);
  useEffect(() => (active ? save(KEYS.active, active) : remove(KEYS.active)), [active]);

  // Visitor ready → analytics + today's status.
  const refreshStatus = useCallback(async () => {
    if (!visitor) return;
    try {
      const s = await api.me(visitor.id);
      setStatus(s);
      if (s.dbConnected) {
        setProgress((p) => {
          const completed = { ...p.completed, ...s.completed };
          const totalXp = Object.values(completed).reduce((a, c) => a + (c.xp || 0), 0);
          return { completed, totalXp };
        });
      }
    } catch {
      /* keep the last known status; the UI still works */
    }
  }, [visitor]);

  useEffect(() => {
    if (!visitor) return;
    setTrackingVisitor(visitor.id);
    track('app_open', { resumed: Boolean(active) });
    refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitor?.id]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [active?.step, active?.fuIndex, view, visitor?.id]);

  const update = useCallback((patch) => setActive((a) => (a ? { ...a, ...(typeof patch === 'function' ? patch(a) : patch) } : a)), []);

  // ---------------------------------------------------------------- actions

  function onboard(v, restored) {
    setVisitor(v);
    if (restored) setProgress(restored);
  }

  function beginScenario(id) {
    const s = { sessionId: uuid(), scenarioId: id, step: 'write', draft: '', versions: [], replies: ['', ''], skipped: [false, false], fuIndex: 0 };
    setActive(s);
    setView('session');
    track('scenario_opened', { sessionId: s.sessionId, scenarioId: id, replay: Boolean(progress.completed[id]) });
  }

  function openScenario(id) {
    if (active && active.scenarioId === id && active.step !== 'verdict') {
      setView('session');
      return; // resume
    }
    const started = active && active.step !== 'verdict' && active.versions.length > 0;
    const drafting = active && active.step === 'write' && active.versions.length === 0 && active.draft.trim();
    if (started || drafting) {
      const title = scenarioById[active.scenarioId].title;
      setConfirm({
        title: started ? 'Leave your scenario unfinished?' : 'Discard your draft?',
        body: started
          ? `"${title}" is in progress. If you start a new one, it stays unfinished and still counts toward today's limit.`
          : `You have an unsent draft for "${title}". Starting a new scenario will discard it.`,
        confirmLabel: 'Start new scenario',
        onConfirm: () => {
          if (started) track('session_abandoned', { sessionId: active.sessionId, scenarioId: active.scenarioId, step: active.step });
          beginScenario(id);
        },
      });
      return;
    }
    beginScenario(id);
  }

  function finishSession(verdict) {
    if (!verdict.practice) {
      setProgress((p) => {
        const completed = { ...p.completed, [active.scenarioId]: { xp: verdict.xp.total, verdict: verdict.verdict, final: verdict.final } };
        return { completed, totalXp: p.totalXp + verdict.xp.total };
      });
    }
    update({ step: 'verdict', verdict });
    track('verdict_shown', {
      sessionId: active.sessionId,
      scenarioId: active.scenarioId,
      final: verdict.final,
      verdict: verdict.verdict,
      xp: verdict.xp.total,
    });
    refreshStatus();
  }

  function exitSession() {
    setActive(null);
    setView('home');
    refreshStatus();
  }

  function markCodeSaved() {
    setVisitor((v) => ({ ...v, codeSaved: true }));
    track('code_copied');
  }

  function signOut() {
    setVisitor(null);
    setProgress(emptyProgress);
    setActive(null);
    setStatus(null);
    setProfileOpen(false);
    setView('home');
  }

  // ---------------------------------------------------------------- render

  const scenario = active ? scenarioById[active.scenarioId] : null;
  const inSession = Boolean(active && view === 'session');

  const banners = useMemo(() => {
    const out = [];
    if (!online) out.push(<Banner key="off" tone="warn">You're offline. Your writing is saved on this device; submit once you're back online.</Banner>);
    if (!storageOk)
      out.push(
        <Banner key="st" tone="info">
          Your browser is blocking storage (private mode?). Everything works, but progress won't be kept after you close this tab.
        </Banner>
      );
    return out;
  }, [online]);

  if (!visitor) {
    return (
      <>
        {banners}
        <Onboarding onDone={onboard} />
      </>
    );
  }

  let body;
  if (view === 'leaderboard') {
    body = <Leaderboard visitor={visitor} onBack={() => setView('home')} />;
  } else if (inSession) {
    const common = { scenario, active, visitor, online, update, onExit: () => setView('home') };
    if (active.step === 'write') {
      body = <Writer {...common} progress={progress} onDailyLimit={refreshStatus} />;
    } else if (active.step === 'feedback') {
      body = <Feedback {...common} />;
    } else if (active.step === 'interview') {
      body = <Interview {...common} progress={progress} onVerdict={finishSession} />;
    } else {
      body = (
        <Verdict
          {...common}
          onNext={exitSession}
          onLeaderboard={() => {
            exitSession();
            setView('leaderboard');
          }}
          onCodeSaved={markCodeSaved}
        />
      );
    }
  } else {
    body = (
      <Home
        visitor={visitor}
        progress={progress}
        status={status}
        active={active && active.step !== 'verdict' ? active : null}
        onOpen={openScenario}
        onResume={() => setView('session')}
        onLeaderboard={() => setView('leaderboard')}
      />
    );
  }

  return (
    <div className="app">
      <TopBar
        visitor={visitor}
        progress={progress}
        status={status}
        view={view}
        onHome={() => {
          if (active?.step === 'verdict') setActive(null);
          setView('home');
        }}
        onLeaderboard={() => setView('leaderboard')}
        onProfile={() => setProfileOpen(true)}
      />
      <main className="main">
        {banners}
        {body}
      </main>
      {profileOpen && <ProfileSheet visitor={visitor} progress={progress} onClose={() => setProfileOpen(false)} onCopied={markCodeSaved} onSignOut={signOut} />}
      {confirm && (
        <Modal
          title={confirm.title}
          onClose={() => setConfirm(null)}
          actions={[
            { label: 'Cancel', onClick: () => setConfirm(null) },
            {
              label: confirm.confirmLabel,
              primary: true,
              onClick: () => {
                confirm.onConfirm();
                setConfirm(null);
              },
            },
          ]}
        >
          <p>{confirm.body}</p>
        </Modal>
      )}
    </div>
  );
}
