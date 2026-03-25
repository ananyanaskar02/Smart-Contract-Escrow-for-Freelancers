"use client";

import { useState, useCallback, useEffect } from "react";
import {
  initEscrow,
  releaseFunds,
  refundEscrow,
  getEscrowStatus,
  CONTRACT_ADDRESS,
} from "@/hooks/contract";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Spotlight } from "@/components/ui/spotlight";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Icons ────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 18V6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 14v4h4" />
      <path d="M7 18c-2.8-2.3-4.5-5.3-4.8-8.5A10 10 0 0 1 12 6a10 10 0 0 1 9.4 6.2" />
    </svg>
  );
}

// ── Styled Input ─────────────────────────────────────────────

function Input({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">
        {label}
      </label>
      <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#7c6cf0]/30 focus-within:shadow-[0_0_20px_rgba(124,108,240,0.08)]">
        <input
          {...props}
          className="w-full rounded-[11px] bg-transparent px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/15 outline-none"
        />
      </div>
    </div>
  );
}

// ── Method Signature ─────────────────────────────────────────

function MethodSignature({
  name,
  params,
  returns,
  color,
}: {
  name: string;
  params: string;
  returns?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 font-mono text-sm">
      <span style={{ color }} className="font-semibold">fn</span>
      <span className="text-white/70">{name}</span>
      <span className="text-white/20 text-xs">{params}</span>
      {returns && (
        <span className="ml-auto text-white/15 text-[10px]">{returns}</span>
      )}
    </div>
  );
}

// ── Status Config ────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; dot: string; variant: "success" | "warning" | "info" }> = {
  PEND: { color: "text-[#fbbf24]", bg: "bg-[#fbbf24]/10", border: "border-[#fbbf24]/20", dot: "bg-[#fbbf24]", variant: "warning" },
  DONE: { color: "text-[#34d399]", bg: "bg-[#34d399]/10", border: "border-[#34d399]/20", dot: "bg-[#34d399]", variant: "success" },
};

// ── Main Component ───────────────────────────────────────────

type Tab = "create" | "release" | "refund" | "status";

interface ContractUIProps {
  walletAddress: string | null;
  onConnect: () => void;
  isConnecting: boolean;
}

export default function ContractUI({ walletAddress, onConnect, isConnecting }: ContractUIProps) {
  const [activeTab, setActiveTab] = useState<Tab>("create");
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // Create escrow state
  const [clientAddr, setClientAddr] = useState("");
  const [freelancerAddr, setFreelancerAddr] = useState("");
  const [tokenAddr, setTokenAddr] = useState("");
  const [amount, setAmount] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Release/Refund state
  const [isReleasing, setIsReleasing] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);

  // Status state
  const [escrowStatus, setEscrowStatus] = useState<string | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  // Auto-fill wallet address when connected
  useEffect(() => {
    if (walletAddress && !clientAddr) {
      setClientAddr(walletAddress);
    }
  }, [walletAddress, clientAddr]);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleCreateEscrow = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!clientAddr.trim() || !freelancerAddr.trim() || !tokenAddr.trim()) return setError("Fill in all address fields");
    if (!amount.trim() || Number(amount) <= 0) return setError("Enter a valid amount");
    setError(null);
    setIsCreating(true);
    setTxStatus("Awaiting signature...");
    try {
      await initEscrow(
        walletAddress,
        clientAddr.trim(),
        freelancerAddr.trim(),
        tokenAddr.trim(),
        BigInt(amount)
      );
      setTxStatus("Escrow created and funds deposited!");
      setTimeout(() => {
        setTxStatus(null);
        setActiveTab("status");
      }, 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsCreating(false);
    }
  }, [walletAddress, clientAddr, freelancerAddr, tokenAddr, amount]);

  const handleRelease = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    setError(null);
    setIsReleasing(true);
    setTxStatus("Awaiting signature...");
    try {
      await releaseFunds(walletAddress);
      setTxStatus("Funds released to freelancer!");
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsReleasing(false);
    }
  }, [walletAddress]);

  const handleRefund = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    setError(null);
    setIsRefunding(true);
    setTxStatus("Awaiting signature...");
    try {
      await refundEscrow(walletAddress);
      setTxStatus("Funds refunded to client!");
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsRefunding(false);
    }
  }, [walletAddress]);

  const handleCheckStatus = useCallback(async () => {
    setError(null);
    setIsLoadingStatus(true);
    try {
      const result = await getEscrowStatus(walletAddress || undefined);
      setEscrowStatus(result as string);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setIsLoadingStatus(false);
    }
  }, [walletAddress]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "create", label: "Create", icon: <DollarIcon />, color: "#7c6cf0" },
    { key: "release", label: "Release", icon: <SendIcon />, color: "#34d399" },
    { key: "refund", label: "Refund", icon: <UndoIcon />, color: "#fbbf24" },
    { key: "status", label: "Status", icon: <RefreshIcon />, color: "#4fc3f7" },
  ];

  return (
    <div className="w-full max-w-2xl animate-fade-in-up-delayed">
      {/* Toasts */}
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#f87171]/15 bg-[#f87171]/[0.05] px-4 py-3 backdrop-blur-sm animate-slide-down">
          <span className="mt-0.5 text-[#f87171]"><AlertIcon /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#f87171]/90">Error</p>
            <p className="text-xs text-[#f87171]/50 mt-0.5 break-all">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="shrink-0 text-[#f87171]/30 hover:text-[#f87171]/70 text-lg leading-none">&times;</button>
        </div>
      )}

      {txStatus && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#34d399]/15 bg-[#34d399]/[0.05] px-4 py-3 backdrop-blur-sm shadow-[0_0_30px_rgba(52,211,153,0.05)] animate-slide-down">
          <span className="text-[#34d399]">
            {txStatus.includes("on-chain") || txStatus.includes("released") || txStatus.includes("refunded") || txStatus.includes("created") ? <CheckIcon /> : <SpinnerIcon />}
          </span>
          <span className="text-sm text-[#34d399]/90">{txStatus}</span>
        </div>
      )}

      {/* Main Card */}
      <Spotlight className="rounded-2xl">
        <AnimatedCard className="p-0" containerClassName="rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c6cf0]/20 to-[#4fc3f7]/20 border border-white/[0.06]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#7c6cf0]">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/90">Freelancer Escrow</h3>
                <p className="text-[10px] text-white/25 font-mono mt-0.5">{truncate(CONTRACT_ADDRESS)}</p>
              </div>
            </div>
            <Badge variant="info" className="text-[10px]">Soroban</Badge>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/[0.06] px-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setError(null); }}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-3.5 text-sm font-medium transition-all",
                  activeTab === t.key ? "text-white/90" : "text-white/35 hover:text-white/55"
                )}
              >
                <span style={activeTab === t.key ? { color: t.color } : undefined}>{t.icon}</span>
                {t.label}
                {activeTab === t.key && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full transition-all"
                    style={{ background: `linear-gradient(to right, ${t.color}, ${t.color}66)` }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Create Escrow */}
            {activeTab === "create" && (
              <div className="space-y-5">
                <MethodSignature name="init" params="(client, freelancer, token, amount)" color="#7c6cf0" />
                <Input label="Client Address (You)" value={clientAddr} onChange={(e) => setClientAddr(e.target.value)} placeholder="G... (your wallet)" />
                <Input label="Freelancer Address" value={freelancerAddr} onChange={(e) => setFreelancerAddr(e.target.value)} placeholder="G... (freelancer's wallet)" />
                <Input label="Token Address" value={tokenAddr} onChange={(e) => setTokenAddr(e.target.value)} placeholder="G... (e.g., USDC contract)" />
                <Input label="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1000000 (in token units)" />

                {walletAddress ? (
                  <ShimmerButton onClick={handleCreateEscrow} disabled={isCreating} shimmerColor="#7c6cf0" className="w-full">
                    {isCreating ? <><SpinnerIcon /> Creating Escrow...</> : <><DollarIcon /> Create & Deposit</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#7c6cf0]/20 bg-[#7c6cf0]/[0.03] py-4 text-sm text-[#7c6cf0]/60 hover:border-[#7c6cf0]/30 hover:text-[#7c6cf0]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to create escrow
                  </button>
                )}
              </div>
            )}

            {/* Release Funds */}
            {activeTab === "release" && (
              <div className="space-y-5">
                <MethodSignature name="release" params="()" color="#34d399" />
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-sm text-white/60">
                    Release the escrowed funds to the freelancer. This action can only be performed by the client.
                  </p>
                </div>

                {walletAddress ? (
                  <ShimmerButton onClick={handleRelease} disabled={isReleasing} shimmerColor="#34d399" className="w-full">
                    {isReleasing ? <><SpinnerIcon /> Releasing...</> : <><SendIcon /> Release to Freelancer</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#34d399]/20 bg-[#34d399]/[0.03] py-4 text-sm text-[#34d399]/60 hover:border-[#34d399]/30 hover:text-[#34d399]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to release funds
                  </button>
                )}
              </div>
            )}

            {/* Refund */}
            {activeTab === "refund" && (
              <div className="space-y-5">
                <MethodSignature name="refund" params="()" color="#fbbf24" />
                <div className="rounded-xl border border-[#fbbf24]/15 bg-[#fbbf24]/[0.03] p-4">
                  <p className="text-sm text-[#fbbf24]/70">
                    Refund the escrowed funds back to the client. Only available if funds have not been released yet.
                  </p>
                </div>

                {walletAddress ? (
                  <ShimmerButton onClick={handleRefund} disabled={isRefunding} shimmerColor="#fbbf24" className="w-full">
                    {isRefunding ? <><SpinnerIcon /> Refunding...</> : <><UndoIcon /> Refund to Client</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#fbbf24]/20 bg-[#fbbf24]/[0.03] py-4 text-sm text-[#fbbf24]/60 hover:border-[#fbbf24]/30 hover:text-[#fbbf24]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to refund
                  </button>
                )}
              </div>
            )}

            {/* Status */}
            {activeTab === "status" && (
              <div className="space-y-5">
                <MethodSignature name="status" params="()" returns="-> Symbol" color="#4fc3f7" />
                
                <ShimmerButton onClick={handleCheckStatus} disabled={isLoadingStatus} shimmerColor="#4fc3f7" className="w-full">
                  {isLoadingStatus ? <><SpinnerIcon /> Checking...</> : <><RefreshIcon /> Check Status</>}
                </ShimmerButton>

                {escrowStatus && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden animate-fade-in-up">
                    <div className="border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-white/25">Escrow Status</span>
                      {(() => {
                        const cfg = STATUS_CONFIG[escrowStatus];
                        return cfg ? (
                          <Badge variant={cfg.variant}>
                            <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                            {escrowStatus === "PEND" ? "Pending" : "Released"}
                          </Badge>
                        ) : (
                          <Badge>{escrowStatus}</Badge>
                        );
                      })()}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/35">Current State</span>
                        <span className="font-mono text-sm text-white/80">{escrowStatus}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.04] px-6 py-3 flex items-center justify-between">
            <p className="text-[10px] text-white/15">Freelancer Escrow &middot; Soroban</p>
            <div className="flex items-center gap-2">
              {["PEND", "DONE"].map((s, i) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span className={cn("h-1 w-1 rounded-full", STATUS_CONFIG[s]?.dot ?? "bg-white/20")} />
                  <span className="font-mono text-[9px] text-white/15">{s === "PEND" ? "Pending" : "Released"}</span>
                  {i < 1 && <span className="text-white/10 text-[8px]">&rarr;</span>}
                </span>
              ))}
            </div>
          </div>
        </AnimatedCard>
      </Spotlight>
    </div>
  );
}
