import { AgentMessageDetails, TxBatchProgram } from './TxBatchProof';
import { Field, SelfProof, assert, Cache } from 'o1js';

const PROOFS_ENABLED = false;

describe('TxBatchProof', () => {
  beforeAll(async () => {
    console.log('Compiling zkprogram');
    await TxBatchProgram.compile({
      cache: Cache.FileSystem('./cache')
    });
    console.log('Compiled zkprogram');
  });

  it('Should process correct message details', async () => {
    const correctDetails = [
      new AgentMessageDetails({
        agentId: Field.from(1),
        xLoc: Field.from(0),
        yLoc: Field.from(5_000),
        checkSum: Field.from(5_001),
      }),
      new AgentMessageDetails({
        agentId: Field.from(3_000),
        xLoc: Field.from(15_000),
        yLoc: Field.from(20_000),
        checkSum: Field.from(38_000),
      }),
      new AgentMessageDetails({
        agentId: Field.from(1_500),
        xLoc: Field.from(7_500),
        yLoc: Field.from(10_000),
        checkSum: Field.from(19_000),
      }),
    ];

    let proof: SelfProof<Field, Field>;

    for (let i = 0; i < correctDetails.length; i++) {
      console.log('Correct message processing', i);
      if (i == 0) {
        proof = await TxBatchProgram.processFirstMessage(
          Field.from(1),
          correctDetails[i]
        );
      } else {
        proof = await TxBatchProgram.processNextMessage(
          Field.from(1),
          correctDetails[i],
          proof!
        );
      }

      console.log('Correct message processed');
      if (PROOFS_ENABLED) proof.verify();
    }
  });

  it('Should not process incorrect messages', async () => {
    const correctDetails = [
      new AgentMessageDetails({
        agentId: Field.from(1),
        xLoc: Field.from(0),
        yLoc: Field.from(4_999),
        checkSum: Field.from(5_001),
      }),
      new AgentMessageDetails({
        agentId: Field.from(3_000),
        xLoc: Field.from(15_000),
        yLoc: Field.from(20_001),
        checkSum: Field.from(38_001),
      }),
      new AgentMessageDetails({
        agentId: Field.from(3_000),
        xLoc: Field.from(15_001),
        yLoc: Field.from(20_000),
        checkSum: Field.from(38_001),
      }),
      new AgentMessageDetails({
        agentId: Field.from(3_001),
        xLoc: Field.from(15_000),
        yLoc: Field.from(20_000),
        checkSum: Field.from(38_001),
      }),
      new AgentMessageDetails({
        agentId: Field.from(1_500),
        xLoc: Field.from(7_500),
        yLoc: Field.from(10_000),
        checkSum: Field.from(19_001),
      }),
    ];

    let proof: SelfProof<Field, Field>;

    for (let i = 0; i < correctDetails.length; i++) {
      let failed = false;
      console.log('Incorrect message processing', i);
      try {
        if (i == 0) {
          proof = await TxBatchProgram.processFirstMessage(
            Field.from(1),
            correctDetails[i]
          );
        } else {
          proof = await TxBatchProgram.processNextMessage(
            Field.from(1),
            correctDetails[i],
            proof!
          );
        }
        if (PROOFS_ENABLED) proof.verify();
      } catch (e) {
        failed = true;
      }
      assert(failed, 'Not failed incorrect message');
    }
  });
});
