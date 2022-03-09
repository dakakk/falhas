import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import React, { useState } from 'react';
import { Col, Container, Form, Row, Table } from 'react-bootstrap';
import SheetNavbar from '../../components/SheetNavbar';
import database from '../../utils/database';
import { sessionSSR } from '../../utils/session';
import config from '../../../openrpg.config.json';
import useToast from '../../hooks/useToast';
import ErrorToastContainer from '../../components/ErrorToastContainer';
import GeneralDiceRollModal from '../../components/Modals/GeneralDiceRoll';
import DiceRollResultModal from '../../components/Modals/DiceRollResult';
import { ResolvedDice } from '../../utils';
import PlayerSpecField from '../../components/Player/PlayerSpecField';
import DataContainer from '../../components/DataContainer';
import PlayerInfoField from '../../components/Player/PlayerInfoField';
import PlayerAttributeContainer from '../../components/Player/Attribute/PlayerAttributeContainer';
import PlayerCharacteristicField from '../../components/Player/PlayerCharacteristicField';
import PlayerEquipmentField from '../../components/Player/PlayerEquipmentField';
import api from '../../utils/api';
import AddDataModal from '../../components/Modals/AddDataModal';
import PlayerItemField from '../../components/Player/PlayerItemField';
import PlayerSkillField from '../../components/Player/PlayerSkillField';
import EditAvatarModal from '../../components/Modals/EditAvatarModal';

export const toastsContext = React.createContext<(err: any) => void>(() => { });
export const diceRollResultContext = React.createContext<(dices: string | ResolvedDice[], resolverKey?: string) => void>(() => { });

const bonusDamageName = 'Dano Bônus';

type PlayerEquipment = {
    currentAmmo: number | null;
    using: boolean;
    Equipment: {
        id: number;
        ammo: number | null;
        attacks: string;
        damage: string;
        name: string;
        range: string;
        type: string;
        Skill: {
            name: string;
        };
    };
};

type PlayerSkill = {
    value: number;
    Skill: {
        id: number;
        name: string;
        Specialization: {
            name: string;
        } | null;
    };
};

type PlayerItem = {
    Item: {
        id: number;
        name: string;
    };
    currentDescription: string;
    quantity: number;
};

export default function Sheet1(props: InferGetServerSidePropsType<typeof getServerSidePropsPage1>): JSX.Element {
    //Toast
    const [toasts, addToast] = useToast();

    //Dices
    const [generalDiceRollShow, setGeneralDiceRollShow] = useState(false);
    const [diceRoll, setDiceRoll] = useState<{ dices: string | ResolvedDice[], resolverKey?: string }>({ dices: '' });

    //Avatar
    const [avatarModalShow, setAvatarModalShow] = useState(false);

    //Data
    const [bonusDamage, setBonusDamage] = useState(props.playerSpecs.find(spec => spec.Spec.name === bonusDamageName)?.value);

    function onBonusDamageChanged(name: string, value: string) {
        if (name !== bonusDamageName) return;
        setBonusDamage(value);
    }

    //Equipments
    const [addEquipmentShow, setAddEquipmentShow] = useState(false);
    const [equipments, setEquipments] = useState<{ id: number, name: string }[]>(props.availableEquipments.map(eq => {
        return {
            id: eq.id,
            name: eq.name
        };
    }));
    const [playerEquipments, setPlayerEquipments] = useState<PlayerEquipment[]>(props.playerEquipments);

    function onAddEquipment(id: number) {
        api.put('/sheet/player/equipment', { id }).then(res => {
            const equipment = res.data.equipment as PlayerEquipment;
            setPlayerEquipments([...playerEquipments, equipment]);

            const newEquipments = [...equipments];
            newEquipments.splice(newEquipments.findIndex(eq => eq.id === id), 1);
            setEquipments(newEquipments);
        }).catch(addToast);
    }

    function onDeleteEquipment(id: number) {
        const newPlayerEquipments = [...playerEquipments];
        const index = newPlayerEquipments.findIndex(eq => eq.Equipment.id === id);

        newPlayerEquipments.splice(index, 1);
        setPlayerEquipments(newPlayerEquipments);

        const modalEquipment = { id, name: playerEquipments[index].Equipment.name };
        setEquipments([...equipments, modalEquipment]);
    }

    //Skills
    const [addSkillShow, setAddSkillShow] = useState(false);
    const [skills, setSkills] = useState<{ id: number, name: string }[]>(props.availableSkills.map(eq => {
        return {
            id: eq.id,
            name: eq.name
        };
    }));
    const [playerSkills, setPlayerSkills] = useState<PlayerSkill[]>(props.playerSkills);

    function onAddSkill(id: number) {
        api.put('/sheet/player/skill', { id }).then(res => {
            const skill = res.data.skill;
            setPlayerSkills([...playerSkills, skill]);

            const newSkills = [...skills];
            newSkills.splice(newSkills.findIndex(eq => eq.id === id), 1);
            setSkills(newSkills);
        }).catch(addToast);
    }

    //Items
    const [addItemShow, setAddItemShow] = useState(false);
    const [items, setItems] = useState<{ id: number, name: string }[]>(props.availableItems.map(eq => {
        return {
            id: eq.id,
            name: eq.name
        };
    }));
    const [playerItems, setPlayerItems] = useState<PlayerItem[]>(props.playerItems);

    function onAddItem(id: number) {
        api.put('/sheet/player/item', { id }).then(res => {
            const item = res.data.item as PlayerItem;
            setPlayerItems([...playerItems, item]);

            const newItems = [...items];
            newItems.splice(newItems.findIndex(eq => eq.id === id), 1);
            setItems(newItems);
        }).catch(addToast);
    }

    function onDeleteItem(id: number) {
        const newPlayerItems = [...playerItems];
        const index = newPlayerItems.findIndex(eq => eq.Item.id === id);

        newPlayerItems.splice(index, 1);
        setPlayerItems(newPlayerItems);

        const modalItem = { id, name: playerItems[index].Item.name };
        setItems([...items, modalItem]);
    }

    const attributeStatus = props.playerAttributeStatus.map(stat => stat.AttributeStatus);

    return (
        <>
            <SheetNavbar />
            <toastsContext.Provider value={addToast}>
                <diceRollResultContext.Provider value={(dices, resolverKey) => { setDiceRoll({ dices, resolverKey }); }}>
                    <Container className='mt-2'>
                        <Row className='display-5 text-center'>
                            <Col>
                                Perfil de {config.player.role}
                            </Col>
                        </Row>
                        <Row>
                            <DataContainer title='Detalhes Pessoais'>
                                {props.playerInfo.map(pinfo =>
                                    <PlayerInfoField key={pinfo.Info.id} info={pinfo.Info} value={pinfo.value} />
                                )}
                            </DataContainer>
                            <Col>
                                <PlayerAttributeContainer playerAttributes={props.playerAttributes}
                                    playerStatus={props.playerAttributeStatus}
                                    generalDiceShow={() => setGeneralDiceRollShow(true)}
                                    avatarEditShow={() => setAvatarModalShow(true)} />
                                <Row className='justify-content-center'>
                                    {props.playerSpecs.map(spec =>
                                        <PlayerSpecField key={spec.Spec.id} value={spec.value} Spec={spec.Spec}
                                            onSpecChanged={onBonusDamageChanged} />
                                    )}
                                </Row>
                            </Col>
                        </Row>
                        <Row>
                            <DataContainer title='Atributos'>
                                <Row className='mb-3 text-center align-items-end justify-content-center'>
                                    {props.playerCharacteristics.map(char =>
                                        <PlayerCharacteristicField key={char.Characteristic.id}
                                            characteristic={char.Characteristic} value={char.value} />
                                    )}
                                </Row>
                            </DataContainer>
                        </Row>
                        <Row>
                            <DataContainer title='Combate' onAdd={() => setAddEquipmentShow(true)}>
                                <Row className='mb-3 text-center'>
                                    <Col>
                                        <Table responsive variant='dark' className='align-middle'>
                                            <thead>
                                                <tr>
                                                    <th></th>
                                                    <th>Usando</th>
                                                    <th>Nome</th>
                                                    <th>Perícia</th>
                                                    <th>Tipo</th>
                                                    <th>Dano</th>
                                                    <th></th>
                                                    <th>Alcance</th>
                                                    <th>Ataques</th>
                                                    <th>Mun. Atual</th>
                                                    <th>Mun. Máxima</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {playerEquipments.map(eq =>
                                                    <PlayerEquipmentField key={eq.Equipment.id} equipment={eq.Equipment}
                                                        currentAmmo={eq.currentAmmo} using={eq.using} onDelete={onDeleteEquipment} />
                                                )}
                                            </tbody>
                                        </Table>
                                    </Col>
                                </Row>
                            </DataContainer>
                        </Row>
                        <Row>
                            <DataContainer title='Perícias' onAdd={() => setAddSkillShow(true)}>
                                <Row>

                                </Row>
                                <Row className='mb-3 mx-1 text-center justify-content-center'>
                                    {playerSkills.map(skill =>
                                        <PlayerSkillField key={skill.Skill.id} value={skill.value}
                                            skill={skill.Skill} />
                                    )}
                                </Row>
                            </DataContainer>
                        </Row>
                        <Row>
                            <DataContainer title='Itens' onAdd={() => setAddItemShow(true)}>
                                <Table responsive variant='dark' className='align-middle'>
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th>Nome</th>
                                            <th>Descrição</th>
                                            <th>Quant.</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {playerItems.map(eq =>
                                            <PlayerItemField key={eq.Item.id} description={eq.currentDescription}
                                                item={eq.Item} quantity={eq.quantity} onDelete={onDeleteItem} />
                                        )}
                                    </tbody>
                                </Table>
                            </DataContainer>
                        </Row>
                    </Container>
                    <GeneralDiceRollModal show={generalDiceRollShow} onHide={() => setGeneralDiceRollShow(false)} />
                </diceRollResultContext.Provider>
                <DiceRollResultModal dices={diceRoll.dices} resolverKey={diceRoll.resolverKey}
                    onHide={() => setDiceRoll({ dices: '', resolverKey: '' })} bonusDamage={bonusDamage} />
                <EditAvatarModal attributeStatus={attributeStatus} show={avatarModalShow} onHide={() => setAvatarModalShow(false)} />

                <AddDataModal dataName='Equipamento' show={addEquipmentShow} onHide={() => setAddEquipmentShow(false)}
                    data={equipments} onAddData={onAddEquipment} />
                <AddDataModal dataName='Perícia' show={addSkillShow} onHide={() => setAddSkillShow(false)}
                    data={skills} onAddData={onAddSkill} />
                <AddDataModal dataName='Item' show={addItemShow} onHide={() => setAddItemShow(false)}
                    data={items} onAddData={onAddItem} />
            </toastsContext.Provider>
            <ErrorToastContainer toasts={toasts} />
        </>
    );
}

async function getServerSidePropsPage1(ctx: GetServerSidePropsContext) {
    const player = ctx.req.session.player;

    if (!player) {
        return {
            redirect: {
                destination: '/',
                permanent: false
            },
            props: {
                playerID: 0,
                playerInfo: [],
                playerAttributes: [],
                playerAttributeStatus: [],
                playerSpecs: [],
                playerCharacteristics: [],
                playerEquipments: [],
                playerSkills: [],
                playerItems: [],
                availableEquipments: [],
                availableSkills: [],
                availableItems: [],
            }
        };
    }

    const playerID = player.id;

    const results = await Promise.all([
        database.playerInfo.findMany({
            where: { player_id: playerID },
            select: { Info: true, value: true }
        }),

        database.playerAttribute.findMany({
            where: { player_id: playerID },
            select: { Attribute: true, value: true, maxValue: true }
        }),

        database.playerAttributeStatus.findMany({
            where: { player_id: playerID },
            select: { AttributeStatus: true, value: true }
        }),

        database.playerSpec.findMany({
            where: { player_id: playerID },
            select: { Spec: true, value: true }
        }),

        database.playerCharacteristic.findMany({
            where: { player_id: playerID },
            select: { Characteristic: true, value: true }
        }),

        database.playerEquipment.findMany({
            where: { player_id: playerID },
            select: {
                Equipment: {
                    select: {
                        Skill: { select: { name: true } },
                        id: true, ammo: true, attacks: true, damage: true,
                        name: true, range: true, type: true
                    }
                },
                currentAmmo: true, using: true
            }
        }),

        database.playerSkill.findMany({
            where: { player_id: playerID },
            select: {
                Skill: { select: { id: true, name: true, Specialization: { select: { name: true } } } },
                value: true
            }
        }),

        database.playerItem.findMany({
            where: { player_id: playerID },
            select: {
                Item: { select: { name: true, id: true } },
                currentDescription: true, quantity: true
            }
        }),

        database.equipment.findMany({
            where: { visible: true, PlayerEquipment: { none: { player_id: playerID } } },
        }),

        database.skill.findMany({
            where: { PlayerSkill: { none: { player_id: playerID } } },
        }),

        database.item.findMany({
            where: { visible: true, PlayerItem: { none: { player_id: playerID } } },
        }),
    ]);

    return {
        props: {
            playerID,
            playerInfo: results[0],
            playerAttributes: results[1],
            playerAttributeStatus: results[2],
            playerSpecs: results[3],
            playerCharacteristics: results[4],
            playerEquipments: results[5],
            playerSkills: results[6],
            playerItems: results[7],
            availableEquipments: results[8],
            availableSkills: results[9],
            availableItems: results[10],
        }
    };
}
export const getServerSideProps = sessionSSR(getServerSidePropsPage1);