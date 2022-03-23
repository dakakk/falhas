import DataContainer from '../../DataContainer';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Table from 'react-bootstrap/Table';
import { useContext, useState } from 'react';
import { ExtraInfo } from '@prisma/client';
import api from '../../../utils/api';
import { ErrorLogger } from '../../../contexts';
import CreateExtraInfoModal from '../../Modals/CreateExtraInfoModal';
import ExtraInfoEditorField from './ExtraInfoEditorField';

type ExtraInfoEditorContainerProps = {
    extraInfo: ExtraInfo[];
}

export default function ExtraInfoEditorContainer(props: ExtraInfoEditorContainerProps) {
    const logError = useContext(ErrorLogger);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [extraInfo, setExtraInfo] = useState(props.extraInfo);

    function createExtraInfo(name: string) {
        api.put('/sheet/extrainfo', { name }).then(res => {
            const id = res.data.id;
            setExtraInfo([...extraInfo, { id, name }]);
        }).catch(logError);
    }

    function deleteExtraInfo(id: number) {
        if (!confirm('Tem certeza de que deseja apagar esse item?')) return;
        api.delete('/sheet/extrainfo', { data: { id } }).then(() => {
            const newExtraInfo = [...extraInfo];
            const index = newExtraInfo.findIndex(extraInfo => extraInfo.id === id);
            if (index > -1) {
                newExtraInfo.splice(index, 1);
                setExtraInfo(newExtraInfo);
            }
        }).catch(logError);
    }

    return (
        <>
            <DataContainer outline title='Informações Pessoais (Extra)'
                addButton={{ onAdd: () => setShowInfoModal(true) }}>
                <Row>
                    <Col>
                        <Table responsive className='align-middle'>
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>Nome</th>
                                </tr>
                            </thead>
                            <tbody>
                                {extraInfo.map(info =>
                                    <ExtraInfoEditorField key={info.id}
                                        extraInfo={info} onDelete={deleteExtraInfo} />
                                )}
                            </tbody>
                        </Table>
                    </Col>
                </Row>
            </DataContainer>
            <CreateExtraInfoModal show={showInfoModal} onHide={() => setShowInfoModal(false)}
                onCreate={createExtraInfo} />
        </>
    );
}