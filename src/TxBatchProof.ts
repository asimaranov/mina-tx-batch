import {
  SelfProof,
  Field,
  ZkProgram,
  Struct,
  assert,
  SmartContract,
  state,
  State,
  Provable,
} from 'o1js';

const MAX_AGENT_ID = 3000;
const MAX_X_LOC = 15000;
const MAX_Y_LOC = 20000;
const MIN_Y_LOC = 5000;

export class AgentMessageDetails extends Struct({
  agentId: Field,
  xLoc: Field,
  yLoc: Field,
  checkSum: Field,
}) {
  verify() {
    const check1 = this.agentId.lessThanOrEqual(MAX_AGENT_ID);
    const check2 = this.xLoc.lessThanOrEqual(MAX_X_LOC);
    const check3 = this.yLoc.lessThanOrEqual(MAX_Y_LOC);
    const check4 = this.yLoc.greaterThanOrEqual(MIN_Y_LOC);
    const check5 = this.yLoc.greaterThan(this.xLoc);
    const check6 = this.checkSum.equals(
      this.agentId.add(this.xLoc).add(this.yLoc)
    );

    return this.agentId
      .equals(0)
      .or(check1.and(check2).and(check3).and(check4).and(check5).and(check6));
  }
}

export const TxBatchProgram = ZkProgram({
  name: 'tx-batch-proof',
  publicInput: Field,
  publicOutput: Field,
  methods: {
    processFirstMessage: {
      privateInputs: [AgentMessageDetails],
      method(messageNumber: Field, messageDetails: AgentMessageDetails) {
        messageDetails.verify().assertTrue('Conditions error');
        return messageNumber;
      },
    },
    processNextMessage: {
      privateInputs: [AgentMessageDetails, SelfProof],
      method(
        messageNumber: Field,
        messageDetails: AgentMessageDetails,
        earlierProof: SelfProof<Field, Field>
      ) {
        earlierProof.verify();

        messageNumber.greaterThan(earlierProof.publicInput).or(messageDetails.verify());

        return Provable.if(messageNumber.greaterThan(earlierProof.publicInput), messageNumber, earlierProof.publicInput);
      },
    },
  },
});

export class TxBatchProof extends ZkProgram.Proof(TxBatchProgram) {}

export class TxBatchProcessorContract extends SmartContract {
  @state(Field) highestMsgNum = State<Field>();

  addBatchProof(txBatchProof: TxBatchProof) {
    txBatchProof.verify();
    this.highestMsgNum.set(txBatchProof.publicOutput);
  }
}
