import { Row, Col, Container, Image } from 'react-bootstrap';
import SheetModal from './SheetModal';
import { useContext, useEffect, useState } from 'react';
import { DiceResult, ResolvedDice, resolveDices } from '../../utils';
import api from '../../utils/api';
import styles from '../../styles/DiceRoll.module.scss';
import { ErrorLogger } from '../../contexts';

type DiceRollResultProps = {
    onHide(): void;
    dices: string | ResolvedDice[];
    resolverKey?: string;
    bonusDamage?: string;
}

export default function DiceRollResult(props: DiceRollResultProps) {
    const [resultDices, setResultDices] = useState<DiceResult[]>([]);
    const logError = useContext(ErrorLogger);
    useEffect(() => {
        if (props.dices.length === 0) return;
        let resolved = props.dices;
        if (typeof props.dices === 'string') {
            const aux = resolveDices(props.dices as string, { bonusDamage: props.bonusDamage });
            if (!aux) return;
            resolved = aux;
        }

        api.post('/dice', { dices: resolved, resolverKey: props.resolverKey }).then(res => {
            setResultDices(res.data.results);
        }).catch(logError);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.dices]);

    function showResult() {
        if (resultDices.length === 0) return (
            <Row className='h-100'>
                <Col>
                    <Image src='/loading.svg' alt='Loading...' fluid />
                </Col>
            </Row>
        );

        let result: DiceResult = { roll: 0 };

        if (resultDices.length === 1) {
            result = resultDices[0];
        }
        else {
            const dices = resultDices.map(d => d.roll);
            const sum = dices.reduce((a, b) => a + b, 0);

            result.roll = sum;
            result.description = dices.join(' + ');
        }

        return (
            <>
                <Row className={styles.roll}>
                    <Col className='h1' >
                        {result.roll}
                    </Col>
                </Row>
                <Row className={styles.description}>
                    <Col>
                        {result.description}
                    </Col>
                </Row>
            </>
        );
    }

    return (
        <SheetModal show={props.dices.length != 0} onExited={() => setResultDices([])}
            title='Resultado da Rolagem' onHide={props.onHide} centered>
            <Container fluid className='text-center'>
                {showResult()}
            </Container>
        </SheetModal>
    );
}