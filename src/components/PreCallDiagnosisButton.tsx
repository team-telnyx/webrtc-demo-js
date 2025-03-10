/* eslint-disable @typescript-eslint/no-explicit-any */
import { useClientOptions } from "@/atoms/clientOptions";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader } from "./ui/dialog";
import { IClientOptions, PreCallDiagnosis, Report } from "@telnyx/webrtc";
import { useState } from "react";
import { DialogTitle } from "@radix-ui/react-dialog";

function hasValidCredentials(options: IClientOptions) {
  const validCredentials = !!options.login && !!options.password;
  const validLoginToken = !!options.login_token;

  return validCredentials || validLoginToken;
}
const PreCallDiagnosisButton = () => {
  const [clientOptions] = useClientOptions();
  const [isOpen, setIsOpen] = useState(false);
  const [report, setReport] = useState<Report | null>(null);

  const onClose = () => {
    setReport(null);
    setIsOpen(false);
  };

  const onPreCallDiagnosis = async () => {
    if (!hasValidCredentials(clientOptions)) {
      return;
    }

    setIsOpen(true);
    try {
      const _report = await PreCallDiagnosis.run({
        credentials: {
          login: clientOptions.login,
          password: clientOptions.password,
          loginToken: clientOptions.login_token,
        },
        texMLApplicationNumber: "+1-240-775-8982",
      });

      setReport(_report);
    } catch (error) {
      console.error(error);
      setReport(null);
    }
  };
  return (
    <>
      <Button
        variant="ghost"
        disabled={isOpen && !report}
        onClick={onPreCallDiagnosis}
      >
        Run pre-call diagnosis
      </Button>
      <Dialog
        onOpenChange={(open) => (!open ? onClose() : null)}
        open={isOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {!report
                ? "Running pre-call diagnosis..."
                : "Pre-call diagnosis report"}
            </DialogTitle>
          </DialogHeader>
          {report && (
            <div className="max-h-[40vh] overflow-y-auto">
              <ReportDisplay report={report} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PreCallDiagnosisButton;

function formatToMS(s: number) {
  return `${(s * 1000).toFixed(2)}ms`;
}
function ReportDisplay(props: { report: Report }) {
  return (
    <div className="grid grid-cols-2 gap-2 font-mono">
      <div className="p-2 rounded border">
        <h4 className="mb-2">Network Quality</h4>
        <p className="text-xs mb-2">
          <b>Quality</b>: {props.report.summaryStats.quality}
        </p>

        <p className="text-xs mb-2">
          <b>MOS</b>: {props.report.summaryStats.mos}
        </p>

        <p className="text-xs mb-2">
          <b>Jitter</b>: min: {formatToMS(props.report.summaryStats.jitter.min)}
          <br />
          max: {formatToMS(props.report.summaryStats.jitter.max)}
          <br />
          avg: {formatToMS(props.report.summaryStats.jitter.average)}
        </p>

        <p className="text-xs">
          <b>RTT</b>: min: {formatToMS(props.report.summaryStats.rtt.min)}{" "}
          <br />
          max: {formatToMS(props.report.summaryStats.rtt.max)} <br />
          avg: {formatToMS(props.report.summaryStats.rtt.average)}
        </p>
      </div>

      <div className="p-2 rounded border">
        <h4>Session Statistics</h4>
        <p className="text-xs mb-2">
          <b>Bytes Sent</b>: {props.report.sessionStats.bytesSent} <br />
          <b>Bytes Received</b>: {props.report.sessionStats.bytesReceived}{" "}
          <br />
          <b>Packets Sent</b>: {props.report.sessionStats.packetsSent} <br />
          <b>Packets Received</b>: {props.report.sessionStats.packetsReceived}
          <br />
        </p>
      </div>

      <div className="p-2 rounded border col-span-2">
        <h4>ICE candidates</h4>

        {props.report.iceCandidateStats.map((candidate: any, index) => {
          console.log(candidate);
          return (
            <p className="text-xs mb-2" key={index}>
              <b>Candidate</b>: {candidate.candidate} <br />
            </p>
          );
        })}
      </div>
    </div>
  );
}
